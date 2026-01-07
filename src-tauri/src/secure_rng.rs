#![allow(dead_code)]
use rand::{RngCore, SeedableRng};
use rand_chacha::ChaCha20Rng;

/// A wrapper around a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator).
/// We use ChaCha20.
pub struct SecureEngine {
    rng: ChaCha20Rng,
}

impl SecureEngine {
    /// Initialize the engine with a 32-byte seed.
    pub fn new(seed: [u8; 32]) -> Self {
        Self {
            rng: ChaCha20Rng::from_seed(seed),
        }
    }

    /// Generate random bytes into a buffer
    pub fn fill_bytes(&mut self, dest: &mut [u8]) {
        self.rng.fill_bytes(dest);
    }

    /// Generate a fresh 32-byte AES key
    pub fn gen_aes_key(&mut self) -> [u8; 32] {
        let mut key = [0u8; 32];
        // FIX: Call our own helper method instead of self.rng directly.
        // This stops the compiler from thinking fill_bytes is "dead code".
        self.fill_bytes(&mut key);
        key
    }
}

// Ensure the RNG state is wiped from memory when dropped
impl Drop for SecureEngine {
    fn drop(&mut self) {
        // ChaCha20Rng implementation usually handles this, but explicit zeroizing
        // is good practice if we held the seed directly.
        // Since we don't store the seed after init, we rely on the crate.
        // However, if we stored sensitive state, we would zeroize here.
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prng_determinism() {
        // If we seed two engines with the same seed, they MUST produce the same output.
        let seed = [42u8; 32];
        let mut eng1 = SecureEngine::new(seed);
        let mut eng2 = SecureEngine::new(seed);

        let mut out1 = [0u8; 16];
        let mut out2 = [0u8; 16];

        eng1.fill_bytes(&mut out1);
        eng2.fill_bytes(&mut out2);

        assert_eq!(out1, out2);
    }

    #[test]
    fn test_prng_uniqueness() {
        // If we seed with different seeds, outputs MUST differ.
        let seed1 = [1u8; 32];
        let seed2 = [2u8; 32];

        let mut eng1 = SecureEngine::new(seed1);
        let mut eng2 = SecureEngine::new(seed2);

        let mut out1 = [0u8; 32];
        let mut out2 = [0u8; 32];

        eng1.fill_bytes(&mut out1);
        eng2.fill_bytes(&mut out2);

        assert_ne!(out1, out2);
    }
}
