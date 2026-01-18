use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VaultEntry {
    pub id: String,
    pub service: String,
    pub username: String,
    pub password: String,
    pub notes: String,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PasswordVault {
    pub entries: Vec<VaultEntry>,
}

impl PasswordVault {
    pub fn new() -> Self {
        Self { entries: Vec::new() }
    }
}