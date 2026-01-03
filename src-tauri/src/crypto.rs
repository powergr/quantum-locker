use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use pqcrypto_kyber::kyber1024;
// Only import traits we actually use methods from
use pqcrypto_traits::kem::{
    Ciphertext as _, SecretKey as _, SharedSecret as _
};
use rand::{RngCore, SeedableRng};
use rand_chacha::ChaCha20Rng;
use rand::rngs::OsRng; // Re-added for fast mode fallback
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow, Context};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2, Params, Algorithm, Version
};
use sha2::{Sha256, Digest}; // Needed for hashing keyfiles

const AES_NONCE_LEN: usize = 12;

#[derive(Serialize, Deserialize, Debug)]
pub struct InnerPayload {
    pub filename: String,
    pub content: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EncryptedFileHeader {
    pub password_salt: String,
    pub wrapping_nonce: Vec<u8>,
    pub encrypted_private_key: Vec<u8>,
    pub hybrid_nonce: Vec<u8>,
    pub kyber_encapped_session_key: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EncryptedFileContainer {
    pub header: EncryptedFileHeader,
    pub ciphertext: Vec<u8>,
}

impl EncryptedFileContainer {
    pub fn save(&self, path: &str) -> Result<()> {
        let file = std::fs::File::create(path).context("Failed to create output file")?;
        serde_json::to_writer(file, self).context("Failed to write encrypted file")?;
        Ok(())
    }

    pub fn load(path: &str) -> Result<Self> {
        let file = std::fs::File::open(path).context("Failed to open encrypted file")?;
        let container: Self = serde_json::from_reader(file).context("Failed to parse encrypted file")?;
        Ok(container)
    }
}

// --- Helper: Multi-Factor Key Derivation ---
// Mixes Password + Optional Keyfile
fn derive_key_multifactor(password: &str, keyfile_bytes: Option<&[u8]>, salt_str: &str) -> [u8; 32] {
    let params = Params::new(15360, 2, 1, Some(32)).expect("Invalid Argon2 params");
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let salt = SaltString::from_b64(salt_str).expect("Invalid salt");
    
    // Combine Password + Hash(Keyfile)
    let mut input_material = password.as_bytes().to_vec();
    if let Some(kb) = keyfile_bytes {
        let mut hasher = Sha256::new();
        hasher.update(kb);
        let key_hash = hasher.finalize();
        input_material.extend_from_slice(&key_hash);
    }

    let hash = argon2.hash_password(&input_material, &salt).expect("Hashing failed");
    
    let mut key = [0u8; 32];
    key.copy_from_slice(hash.hash.unwrap().as_bytes());
    key
}

// --- Main Logic ---

/// LOCK: Bundles filename + data, Encrypts them, Returns Container.
/// Renamed to match main.rs call.
pub fn encrypt_file_with_password(
    password: &str, 
    keyfile_bytes: Option<&[u8]>,
    filename: &str,
    file_bytes: &[u8],
    entropy_seed: Option<[u8; 32]> // Optional: If None, use OS RNG
) -> Result<EncryptedFileContainer> {
    
    // 0. Payload
    let payload = InnerPayload {
        filename: filename.to_string(),
        content: file_bytes.to_vec(),
    };
    let plaintext_blob = serde_json::to_vec(&payload).context("Failed to pack payload")?;

    // 1. Initialize RNG (Chaos or OS)
    let mut rng: Box<dyn RngCore> = match entropy_seed {
        Some(seed) => Box::new(ChaCha20Rng::from_seed(seed)),
        None => Box::new(OsRng), // Fast/Simple mode
    };

    // A. Generate Kyber Keys
    let (pk, sk) = kyber1024::keypair();

    // B. Hybrid Encrypt Body
    let (ss, kyber_ct) = kyber1024::encapsulate(&pk);
    let session_key = aes_gcm::Key::<Aes256Gcm>::from_slice(ss.as_bytes());
    let cipher_session = Aes256Gcm::new(session_key);
    
    let mut hybrid_nonce = [0u8; AES_NONCE_LEN];
    rng.fill_bytes(&mut hybrid_nonce);
    
    let encrypted_body = cipher_session.encrypt(Nonce::from_slice(&hybrid_nonce), plaintext_blob.as_ref())
        .map_err(|_| anyhow!("Body encryption failed"))?;

    // C. Encrypt Kyber Private Key (Multi-Factor)
    let mut salt_bytes = [0u8; 16];
    rng.fill_bytes(&mut salt_bytes);
    let salt = SaltString::encode_b64(&salt_bytes).map_err(|e| anyhow!(e))?.to_string();
    
    let master_key = derive_key_multifactor(password, keyfile_bytes, &salt);
    
    let cipher_master = Aes256Gcm::new_from_slice(&master_key).unwrap();
    let mut wrapping_nonce = [0u8; AES_NONCE_LEN];
    rng.fill_bytes(&mut wrapping_nonce);
    
    let encrypted_priv_key = cipher_master.encrypt(Nonce::from_slice(&wrapping_nonce), sk.as_bytes())
        .map_err(|_| anyhow!("Key wrapping failed"))?;

    // D. Build Container
    Ok(EncryptedFileContainer {
        header: EncryptedFileHeader {
            password_salt: salt,
            wrapping_nonce: wrapping_nonce.to_vec(),
            encrypted_private_key: encrypted_priv_key,
            hybrid_nonce: hybrid_nonce.to_vec(),
            kyber_encapped_session_key: kyber_ct.as_bytes().to_vec(),
        },
        ciphertext: encrypted_body,
    })
}

/// UNLOCK: Decrypts data, Deserializes InnerPayload, Returns Metadata + Content.
/// Renamed to match main.rs call.
pub fn decrypt_file_with_password(
    password: &str, 
    keyfile_bytes: Option<&[u8]>,
    container: &EncryptedFileContainer
) -> Result<InnerPayload> {
    let h = &container.header;

    // A. Unlock Private Key (Multi-Factor)
    let master_key = derive_key_multifactor(password, keyfile_bytes, &h.password_salt);
    let cipher_master = Aes256Gcm::new_from_slice(&master_key).unwrap();

    let sk_bytes = cipher_master.decrypt(Nonce::from_slice(&h.wrapping_nonce), h.encrypted_private_key.as_ref())
        .map_err(|_| anyhow!("Decryption failed: Bad Password or Keyfile"))?;
    
    let sk = kyber1024::SecretKey::from_bytes(&sk_bytes).map_err(|_| anyhow!("Invalid SK struct"))?;

    // B. Unwrap Session Key
    let ct = kyber1024::Ciphertext::from_bytes(&h.kyber_encapped_session_key).map_err(|_| anyhow!("Invalid Kyber CT"))?;
    let ss = kyber1024::decapsulate(&ct, &sk);

    // C. Decrypt Body
    let session_key = aes_gcm::Key::<Aes256Gcm>::from_slice(ss.as_bytes());
    let cipher_session = Aes256Gcm::new(session_key);

    let decrypted_blob = cipher_session.decrypt(Nonce::from_slice(&h.hybrid_nonce), container.ciphertext.as_ref())
        .map_err(|_| anyhow!("Body decryption failed (Auth Tag mismatch)"))?;

    // D. Deserialize
    let payload: InnerPayload = serde_json::from_slice(&decrypted_blob)
        .context("Decrypted data corrupted or wrong format version")?;

    Ok(payload)
}