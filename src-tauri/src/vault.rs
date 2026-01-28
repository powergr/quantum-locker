use serde::{Deserialize, Serialize};

/// Represents a single item in the Password Vault.
///
/// This structure holds the credentials for a specific service.
/// It is serialized into JSON before being encrypted, so it never exists
/// on the disk in plaintext.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VaultEntry {
    /// Unique UUID (v4) to identify this entry for updates/deletions.
    pub id: String,
    
    /// The name of the website or service (e.g., "Google", "Netflix").
    pub service: String,
    
    /// The login username or email address.
    pub username: String,
    
    /// The secret password.
    pub password: String,
    
    /// Optional free-text notes.
    pub notes: String,
    
    /// Timestamp (Unix Epoch) of when this entry was created.
    pub created_at: i64,

    // --- NEW FIELDS (v2.5.5) ---
    // We use #[serde(default)] so existing vaults don't crash when loading.
    
    /// The website URL (e.g., "https://google.com").
    #[serde(default)]
    pub url: String,

    /// The visual card color (Hex Code).
    #[serde(default)]
    pub color: String,

    /// Whether the entry is pinned to the top.
    #[serde(default)]
    pub is_pinned: bool,
}

/// The root container for the Password Manager.
///
/// This entire struct is serialized to JSON, compressed, and encrypted
/// into the `passwords.qre` file.
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PasswordVault {
    pub entries: Vec<VaultEntry>,
}

impl PasswordVault {
    /// Creates a new, empty vault.
    pub fn new() -> Self {
        Self { entries: Vec::new() }
    }
}