# QRE Privacy Toolkit

**The Local-First Swiss Army Knife for Digital Privacy.**

[![Release](https://github.com/powergr/quantum-locker/actions/workflows/build.yml/badge.svg)](https://github.com/powergr/quantum-locker/actions/workflows/build.yml)
![Version](https://img.shields.io/github/v/release/powergr/quantum-locker)
![License](https://img.shields.io/github/license/powergr/quantum-locker)

QRE Toolkit is a secure, cross-platform application designed to handle your sensitive data without relying on the cloud. It runs natively on **Windows, macOS, Linux, and Android**.

**[📥 Download the Latest Release](https://github.com/powergr/quantum-locker/releases)**

---

## 🔒 Key Features

### **1. Military-Grade Security**

Your data is protected using **AES-256-GCM** (Galois/Counter Mode). This provides both confidentiality (they can't read it) and integrity (they can't modify it). Passwords are hardened using **Argon2id**, the winner of the Password Hashing Competition, making GPU brute-force attacks prohibitively expensive.

### **2. Unlimited File Size**

Powered by a custom **Rust Streaming Engine**, QRE Locker processes files chunk-by-chunk. You can encrypt 10GB, 50GB, or even 1TB files without using up your RAM, even on mobile devices.

### **3. Smart Compression**

The app uses **Zstd** compression to save space.
**Auto-Detect:** Automatically applies fast compression to media files (images/video) and high compression to documents/text.
**Extreme Mode:** Forces maximum compression levels for archival storage.

### **4. Cross-Platform & Mobile Ready**

The exact same encryption engine runs on your Desktop and your **Android Phone**.
**Desktop:** Drag & Drop files or folders.
**Android:** Fully native app. Encrypt photos directly from your Gallery or transfer secured files from your PC to your phone.

### **5. Zero Knowledge**

**No Cloud:** Files never leave your device.
**No Accounts:** No email signup, no tracking.
**No Backdoors:** We cannot recover your password. Only you hold the keys.

---

## 🛠️ The Toolkit

### **1. 🔐 File Encryption (Unlimited Size)**

Secure any file—photos, tax documents, 50GB video backups—using military-grade **AES-256-GCM**.
**Streaming Engine:** Encrypts huge files without eating up RAM.
**Cross-Platform:** Lock a file on your PC, unlock it on your Android phone.
**Smart Compression:** Automatically compresses documents while skipping media files.

### **2. 🗑️ Secure Shredder (Desktop)**

When you delete a file, the data remains on your disk. The Shredder overwrites your files with random noise before deleting them, making recovery impossible.
_(Note: On Android, this performs a standard delete due to hardware limitations)._

### **3. 🔑 Password Vault**

A secure, offline place to store your passwords, recovery codes, and sensitive notes.
**Zero-Knowledge:** Your secrets are encrypted with your Master Key.
**Portable:** The vault lives in your local `keychain.json` file, which you can backup to a USB drive.

---

## 🛡️ Security Architecture

**Encryption:** AES-256-GCM (Authenticated Encryption).
**Key Derivation:** Argon2id (Resistant to GPU brute-force).
**Paranoid Mode:** Inject your own physical entropy (mouse movements/touch) to seed the random number generator.
**Panic Button:** `Ctrl+Shift+Q` instantly kills the app and wipes memory (Desktop).

---

## 🚀 Getting Started

1. **Create a Vault:** Set a strong Master Password.
2. **Save your Recovery Code:** This is the _only_ way to restore access if you forget your password.
3. **Start using the tools:** Select a tab on the left to Encrypt, Shred, or Store Passwords.

---

## 📦 Building from Source

```bash
# 1. Install Dependencies
npm install

# 2. Run in Dev Mode
npm run tauri dev

# 3. Build for Release
npm run tauri build
```

## ⚠️ Important Security Notice

QRE Toolkit follows a **Zero-Knowledge** architecture.
If you lose your **Master Password** AND your **Recovery Code**, your data is mathematically inaccessible. There is no "Password Reset" button because there is no server.

**Backup your `keychain.json` file and store your Recovery Code safely.**

---

**License:** MIT
**Copyright:** © 2026 Project QRE
