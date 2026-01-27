use qrcodegen::{QrCode, QrCodeEcc};
use anyhow::Result;

pub fn generate_qr(text: &str) -> Result<String> {
    // Encode text
    let qr = QrCode::encode_text(text, QrCodeEcc::Medium).map_err(|e| anyhow::anyhow!(e))?;
    
    // Convert to SVG String manually
    Ok(to_svg_string(&qr, 4))
}

// Helper to convert QR object to SVG string
fn to_svg_string(qr: &QrCode, border: i32) -> String {
    let size = qr.size();
    let dimension = size + border * 2;
    let mut sb = String::new();
    
    // Header
    sb.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    sb.push_str(&format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 {0} {0}\" stroke=\"none\">", 
        dimension
    ));
    
    // Background (White)
    sb.push_str("<rect width=\"100%\" height=\"100%\" fill=\"#FFFFFF\"/>");
    
    // Path Start
    sb.push_str("<path fill=\"#000000\" d=\"");
    
    // Draw Modules
    for y in 0..size {
        for x in 0..size {
            if qr.get_module(x, y) {
                // Draw 1x1 rectangle at coordinate
                sb.push_str(&format!("M{},{}h1v1h-1z ", x + border, y + border));
            }
        }
    }
    
    // Path End & Footer
    sb.push_str("\"/></svg>");
    
    sb
}