mod crypto;
mod entropy;
mod secure_rng;

use std::fs;
use std::path::{Path, PathBuf};

// --- Helper to handle errors nicely in the UI ---
type CommandResult<T> = Result<T, String>;

/// Helper to read a keyfile into bytes if a path is provided
fn read_keyfile(path_opt: Option<String>) -> Result<Option<Vec<u8>>, String> {
    match path_opt {
        Some(p) => {
            if p.trim().is_empty() { return Ok(None); }
            let path = Path::new(&p);
            let bytes = fs::read(path).map_err(|e| format!("Failed to read keyfile: {}", e))?;
            Ok(Some(bytes))
        },
        None => Ok(None),
    }
}

/// Helper: Smart Rename (Windows style: "file (1).txt")
fn get_unique_path(original_path: &Path) -> PathBuf {
    if !original_path.exists() {
        return original_path.to_path_buf();
    }

    let file_stem = original_path.file_stem().unwrap_or_default().to_string_lossy();
    let extension = original_path.extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();
    
    let parent = original_path.parent().unwrap_or(Path::new("."));

    let mut counter = 1;
    loop {
        let new_name = format!("{} ({}){}", file_stem, counter, extension);
        let new_path = parent.join(new_name);
        if !new_path.exists() {
            return new_path;
        }
        counter += 1;
    }
}

#[tauri::command]
fn lock_file(
    file_path: String, 
    password: String, 
    keyfile_path: Option<String>, // <--- NEW
    extra_entropy: Option<Vec<u8>>
) -> CommandResult<String> {
    
    // 1. Read File
    let path = Path::new(&file_path);
    let filename = path.file_name()
        .ok_or("Invalid filename")?
        .to_str()
        .ok_or("Filename not UTF-8")?;

    let file_bytes = fs::read(path).map_err(|e| e.to_string())?;

    // 2. Read Keyfile (if any)
    let keyfile_bytes = read_keyfile(keyfile_path)?;

    // 3. Handle Entropy
    let entropy_seed = if let Some(bytes) = extra_entropy {
        use sha2::Digest; // Import trait only here
        let mut hasher = sha2::Sha256::new();
        hasher.update(&bytes);
        Some(hasher.finalize().into())
    } else {
        None
    };

    // 4. Encrypt
    let container = crypto::encrypt_file_with_password(
        &password, 
        keyfile_bytes.as_deref(), // Pass the keyfile bytes
        filename, 
        &file_bytes, 
        entropy_seed
    ).map_err(|e| e.to_string())?;

    // 5. Save
    let output_path = format!("{}.qre", file_path);
    container.save(&output_path).map_err(|e| e.to_string())?;

    Ok(format!("Locked file saved to: {}", output_path))
}

#[tauri::command]
fn unlock_file(
    file_path: String, 
    password: String,
    keyfile_path: Option<String> // <--- NEW
) -> CommandResult<String> {
    // 1. Load
    let container = crypto::EncryptedFileContainer::load(&file_path)
        .map_err(|e| e.to_string())?;

    // 2. Read Keyfile
    let keyfile_bytes = read_keyfile(keyfile_path)?;

    // 3. Decrypt
    let payload = crypto::decrypt_file_with_password(
        &password, 
        keyfile_bytes.as_deref(), 
        &container
    ).map_err(|e| e.to_string())?;

    // 4. Determine Output Path (Smart Rename)
    let parent = Path::new(&file_path).parent().unwrap();
    let original_path = parent.join(&payload.filename);
    
    // Calculate a unique path if file exists
    let final_path = get_unique_path(&original_path);

    // 5. Write
    fs::write(&final_path, payload.content).map_err(|e| e.to_string())?;

    // Return the actual filename used
    Ok(format!("File restored: {:?}", final_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![lock_file, unlock_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}