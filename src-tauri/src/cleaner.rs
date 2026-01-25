use anyhow::{anyhow, Result};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
// Use traits to interact with img_parts
use img_parts::ImageICC; 

#[derive(serde::Serialize, Debug)]
pub struct MetadataReport {
    pub has_gps: bool,
    pub has_author: bool,
    pub camera_info: Option<String>,
    pub software_info: Option<String>,
    pub creation_date: Option<String>,
    pub file_type: String,
}

// --- PUBLIC API ---

pub fn analyze_file(path: &Path) -> Result<MetadataReport> {
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();

    match ext.as_str() {
        "jpg" | "jpeg" | "png" | "webp" | "tiff" => analyze_image(path),
        "pdf" => analyze_pdf(path),
        "docx" | "xlsx" | "pptx" => analyze_office(path),
        _ => Err(anyhow!("Unsupported file type")),
    }
}

pub fn remove_metadata(path: &Path) -> Result<PathBuf> {
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    
    // Create output filename: "file_clean.ext"
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let new_name = format!("{}_clean.{}", stem, ext);
    let output_path = path.parent().unwrap_or(Path::new(".")).join(new_name);

    match ext.as_str() {
        "jpg" | "jpeg" => strip_jpeg(path, &output_path)?,
        "png" => strip_png(path, &output_path)?,
        "pdf" => strip_pdf(path, &output_path)?,
        "docx" | "xlsx" | "pptx" => strip_office(path, &output_path)?,
        "zip" => clean_zip_metadata(path, &output_path)?,
        
        _ => return Err(anyhow!("Unsupported file type")),
    }

    Ok(output_path)
}

// --- IMAGE HANDLERS ---

fn analyze_image(path: &Path) -> Result<MetadataReport> {
    let file = File::open(path)?;
    let mut reader = std::io::BufReader::new(&file);
    
    let exifreader = exif::Reader::new();
    let exif = exifreader.read_from_container(&mut reader).ok();

    let mut report = MetadataReport {
        has_gps: false,
        has_author: false,
        camera_info: None,
        software_info: None,
        creation_date: None,
        file_type: "Image".to_string(),
    };

    if let Some(ex) = exif {
        if ex.get_field(exif::Tag::GPSLatitude, exif::In::PRIMARY).is_some() {
            report.has_gps = true;
        }
        if let Some(field) = ex.get_field(exif::Tag::Model, exif::In::PRIMARY) {
            report.camera_info = Some(field.display_value().to_string());
        }
        if let Some(field) = ex.get_field(exif::Tag::DateTime, exif::In::PRIMARY) {
            report.creation_date = Some(field.display_value().to_string());
        }
        if ex.get_field(exif::Tag::Artist, exif::In::PRIMARY).is_some() 
           || ex.get_field(exif::Tag::Copyright, exif::In::PRIMARY).is_some() {
            report.has_author = true;
        }
    }

    Ok(report)
}

fn strip_jpeg(input: &Path, output: &Path) -> Result<()> {
    let input_data = fs::read(input)?;
    let mut jpeg = img_parts::jpeg::Jpeg::from_bytes(input_data.into())
        .map_err(|e| anyhow!("Invalid JPEG: {}", e))?;

    // AGGRESSIVE STRIPPING:
    // Remove APP1-APP15 (Metadata, Exif, XMP, IPTC) and COM (Comments).
    // Keep APP0 (JFIF) because some viewers require it for color handling.
    // Keep DQT, DHT, SOF, SOS (Image Data).
    
    let segments_to_remove: Vec<u8> = (0xE1..=0xEF) // APP1 - APP15
        .chain(std::iter::once(0xFE)) // COM (Comment)
        .collect();

    // img_parts doesn't expose a simple "remove_by_marker", so we filter the vector.
    // However, img_parts::jpeg::Jpeg manages segments internally.
    // We use the traits provided to clear standard blocks first.
    
    // 1. Clear known standards via Trait
    jpeg.set_icc_profile(None);

    // 2. Manually filter the segments vector
    // We need to access the internal segments list if possible, or rebuild it.
    // Since `img_parts` encapsulates it, we use `segments_mut()` to filter.
    
    let segments = jpeg.segments_mut();
    
    // Retain only Safe Segments:
    // 0xE0 (APP0/JFIF), 0xDB (DQT), 0xC0 (SOF0), 0xC4 (DHT), 0xDA (SOS), 0xDD (DRI)
    // Remove anything else that looks like metadata.
    segments.retain(|seg| {
        let marker = seg.marker();
        // Keep standard JPEG structure markers
        if marker == 0xE0 { return true; } // JFIF
        if marker == 0xDB || marker == 0xC4 || marker == 0xDA || marker == 0xDD { return true; }
        if (0xC0..=0xCF).contains(&marker) && marker != 0xC4 && marker != 0xC8 && marker != 0xCC { return true; } // SOF markers
        
        // Explicitly remove Metadata markers
        if segments_to_remove.contains(&marker) { return false; }
        
        // Default: Keep unknown structural markers, drop unknown app markers
        true
    });

    let output_file = File::create(output)?;
    jpeg.encoder().write_to(output_file).map_err(|e| anyhow!("Write error: {}", e))?;
    Ok(())
}

fn strip_png(input: &Path, output: &Path) -> Result<()> {
    let input_data = fs::read(input)?;
    let mut png = img_parts::png::Png::from_bytes(input_data.into())
        .map_err(|e| anyhow!("Invalid PNG: {}", e))?;

    // Standard Critical Chunks (KEEP THESE):
    // IHDR, PLTE, IDAT, IEND
    
    // Metadata Chunks to REMOVE:
    // eXIf (Exif), tEXt (Text), zTXt (Compressed Text), iTXt (Int'l Text)
    // tIME (Time), pHYs (Physical dim), sPLT, iCCP (Color profile), cHRM
    // dSIG (Digital Sig)
    
    // We filter using a whitelist approach for maximum safety, or broad blacklist.
    // Let's use a broad blacklist of metadata chunks.
    
    let metadata_chunks = [
        b"eXIf", b"tEXt", b"zTXt", b"iTXt", 
        b"tIME", b"pHYs", b"iCCP", b"cHRM", 
        b"sRGB", b"gAMA", b"bKGD", b"hist"
    ];

    png.chunks_mut().retain(|chunk| {
        let type_bytes = chunk.kind();
        // Keep if NOT in the blacklist
        !metadata_chunks.contains(&&type_bytes)
    });

    let output_file = File::create(output)?;
    png.encoder().write_to(output_file).map_err(|e| anyhow!("Write error: {}", e))?;
    Ok(())
}

// --- PDF HANDLERS ---

fn analyze_pdf(_path: &Path) -> Result<MetadataReport> {
    Ok(MetadataReport {
        has_gps: false,
        has_author: true, 
        camera_info: None,
        software_info: Some("PDF Generator".into()),
        creation_date: None,
        file_type: "PDF Document".to_string(),
    })
}

fn strip_pdf(input: &Path, output: &Path) -> Result<()> {
    let mut doc = lopdf::Document::load(input).map_err(|e| anyhow!("PDF Load Error: {}", e))?;
    
    // 1. Clear Info Dictionary
    doc.trailer.remove(b"Info");
    
    // 2. Remove Metadata Streams (XMP)
    let mut keys_to_remove = Vec::new();
    for (id, object) in doc.objects.iter() {
        if let lopdf::Object::Stream(ref stream) = object {
             if let Ok(type_obj) = stream.dict.get(b"Type") {
                 if let lopdf::Object::Name(name) = type_obj {
                     if name == b"Metadata" {
                         keys_to_remove.push(*id);
                     }
                 }
             }
        }
    }
    for id in keys_to_remove {
        doc.objects.remove(&id);
    }

    doc.save(output).map_err(|e| anyhow!("PDF Write Error: {}", e))?;
    Ok(())
}

// --- OFFICE DOCS HANDLERS ---

fn analyze_office(_path: &Path) -> Result<MetadataReport> {
    Ok(MetadataReport {
        has_gps: false,
        has_author: true, 
        camera_info: None,
        software_info: Some("Microsoft Office".into()),
        creation_date: None,
        file_type: "Office Document".to_string(),
    })
}

fn strip_office(input: &Path, output: &Path) -> Result<()> {
    let file = File::open(input)?;
    let mut archive = zip::ZipArchive::new(file)?;
    
    let out_file = File::create(output)?;
    let mut zip_writer = zip::ZipWriter::new(out_file);
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let name = file.name().to_string();
        
        // Remove Core Properties, App Properties, and Custom Properties
        if name.contains("docProps/core.xml") || 
           name.contains("docProps/app.xml") || 
           name.contains("docProps/custom.xml") {
            continue; 
        }

        let options = SimpleFileOptions::default()
            .compression_method(file.compression()) 
            .unix_permissions(file.unix_mode().unwrap_or(0o755));
            
        zip_writer.start_file(&name, options).map_err(|e| anyhow!("Zip Error: {}", e))?;
        std::io::copy(&mut file, &mut zip_writer)?;
    }

    zip_writer.finish()?;
    Ok(())
}

fn clean_zip_metadata(input: &Path, output: &Path) -> Result<()> {
    let file = File::open(input)?;
    let mut archive = zip::ZipArchive::new(file)?;
    
    let out_file = File::create(output)?;
    let mut zip_writer = zip::ZipWriter::new(out_file);
    
    // Explicitly set an empty global comment to overwrite any existing one
    zip_writer.set_comment("");

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let name = file.name().to_string();
        
        // 1. Create Clean Options
        // We COPY the compression method (store vs deflate)
        // We DO NOT copy the "last_modified" time (it defaults to now, stripping history)
        // We DO NOT copy "extra_data" (strips UID/GID/NTFS info)
        let options = SimpleFileOptions::default()
            .compression_method(file.compression())
            .unix_permissions(0o755); // Standardize permissions

        // 2. Start File
        zip_writer.start_file(&name, options).map_err(|e| anyhow!("Zip Error: {}", e))?;
        
        // 3. Copy Data Raw
        // We do not modify the content, we just move it to the clean container.
        std::io::copy(&mut file, &mut zip_writer)?;
    }

    zip_writer.finish()?;
    Ok(())
}