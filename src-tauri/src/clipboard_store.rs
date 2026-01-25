use serde::{Deserialize, Serialize};
use regex::Regex;
use chrono::{Utc};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClipboardEntry {
    pub id: String,
    pub content: String,
    pub preview: String, 
    pub category: String,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct ClipboardVault {
    pub entries: Vec<ClipboardEntry>,
}

impl ClipboardVault {
    pub fn new() -> Self {
        Self { entries: Vec::new() }
    }
}

// --- SENSITIVE DATA DETECTION ---

pub fn analyze_content(text: &str) -> Option<String> {
    // 1. Credit Cards
    let card_regex = Regex::new(r"\b(?:\d[ -]*?){13,19}\b").unwrap();
    if card_regex.is_match(text) {
        let nums = text.chars().filter(|c| c.is_numeric()).count();
        if nums >= 13 && nums <= 19 {
            return Some("Credit Card".to_string());
        }
    }

    // 2. Crypto Addresses
    if (text.starts_with("0x") && text.len() == 42) || (text.starts_with("1") && text.len() >= 26 && text.len() <= 35) {
        return Some("Crypto Address".to_string());
    }

    // 3. UUIDs / Generated Tokens (NEW)
    // Matches patterns like: c732ae86-65ca-45cf...
    // Hex chars + hyphens, length 36 is standard UUID, but we accept partials
    let uuid_char_count = text.chars().filter(|c| c.is_ascii_hexdigit()).count();
    let hyphen_count = text.chars().filter(|c| *c == '-').count();
    
    // If it's mostly hex + hyphens and decent length, treat as secret
    if text.len() >= 16 && hyphen_count >= 1 && (uuid_char_count + hyphen_count == text.len()) {
         return Some("Potential Password".to_string()); // Mask this!
    }

    // 4. API Keys
    if text.starts_with("sk-") || text.starts_with("ghp_") || (text.len() > 30 && !text.contains(' ')) {
        return Some("API Key".to_string());
    }

    // 5. Heuristics for Passwords (Updated)
    let has_upper = text.chars().any(|c| c.is_uppercase());
    let has_lower = text.chars().any(|c| c.is_lowercase());
    let has_digit = text.chars().any(|c| c.is_numeric());
    let has_special = text.chars().any(|c| !c.is_alphanumeric());
    let has_space = text.contains(' ');
    
    // Rule A: Standard Strong (Upper + Lower + Digit)
    if !has_space && has_upper && has_lower && has_digit && text.len() >= 8 {
        return Some("Potential Password".to_string());
    }
    
    // Rule B: Lowercase Complex (Lower + Digit + Special) - Catches your case if it had a symbol
    if !has_space && has_lower && has_digit && has_special && text.len() >= 10 {
         return Some("Potential Password".to_string());
    }

    // Default
    Some("Text".to_string())
}

pub fn create_entry(text: &str) -> ClipboardEntry {
    let category = analyze_content(text).unwrap_or("Text".to_string());
    
    let preview = if text.len() > 20 {
        format!("{}...", &text[0..20].replace("\n", " "))
    } else {
        text.to_string()
    };

    ClipboardEntry {
        id: Uuid::new_v4().to_string(),
        content: text.to_string(),
        preview,
        category,
        created_at: Utc::now().timestamp_millis(),
    }
}