#![allow(dead_code)]
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::{Digest, Sha256};
use std::io::{self, Write};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn collect_user_entropy() -> [u8; 32] {
    println!("--- ENTROPY COLLECTION ---");
    println!("Please mash your keyboard randomly for a few seconds and hit ENTER: ");
    print!("> ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("Failed to read line");

    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    let nanos = since_the_epoch.as_nanos().to_le_bytes();

    let mut os_entropy = [0u8; 32];
    OsRng.fill_bytes(&mut os_entropy);

    let mut hasher = Sha256::new();
    hasher.update(&os_entropy);
    hasher.update(input.as_bytes());
    hasher.update(&nanos);

    let result = hasher.finalize();
    println!("Entropy mixed successfully.");
    result.into()
}
