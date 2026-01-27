use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BookmarkEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    pub category: String, // e.g. "Finance", "Work", "Personal"
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct BookmarksVault {
    pub entries: Vec<BookmarkEntry>,
}

impl BookmarksVault {
    pub fn new() -> Self {
        Self { entries: Vec::new() }
    }
}