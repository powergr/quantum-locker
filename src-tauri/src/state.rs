use crate::keychain::MasterKey;
use std::sync::{Arc, Mutex};

pub struct SessionState {
    pub master_key: Arc<Mutex<Option<MasterKey>>>,
}

// Global Constants
pub const MAX_FILE_SIZE: u64 = 4 * 1024 * 1024 * 1024; // 4GB
