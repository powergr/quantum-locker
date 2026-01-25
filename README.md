# QRE Privacy Toolkit

**The Local-First Swiss Army Knife for Digital Privacy.**

[![Release](https://github.com/powergr/qre-privacy-toolkit/actions/workflows/build.yml/badge.svg)](https://github.com/powergr/qre-privacy-toolkit/actions/workflows/build.yml)
![Version](https://img.shields.io/github/v/release/powergr/qre-privacy-toolkit)
![License](https://img.shields.io/github/license/powergr/qre-privacy-toolkit)

QRE Toolkit is a secure, cross-platform application designed to handle your sensitive data without relying on the cloud. It runs natively on **Windows, macOS, Linux, and Android**.

**[📥 Download the Latest Release](https://github.com/powergr/qre-privacy-toolkit/releases)**

---

## 🛠️ The Toolkit

QRE Toolkit combines 6 essential privacy tools into one secure application:

### **1. 🔐 File Encryption**
Secure any file—photos, tax documents, 50GB video backups—using military-grade **AES-256-GCM**.
*   **Unlimited Size:** Powered by a custom **Rust Streaming Engine**, you can encrypt files of any size without using up your RAM.
*   **Smart Compression:** Automatically compresses documents while skipping media files.
*   **Cross-Platform:** Lock a file on your PC, unlock it on your Android phone.

### **2. 🔑 Password Vault**
A secure, offline database for your logins.
*   **Zero-Knowledge:** Your secrets are encrypted with your Master Key inside your local keychain.
*   **Generators:** Built-in strong password generator and strength meter.

### **3. 📝 Secure Notes**
An encrypted notepad for sensitive text that isn't just a password.
*   Store recovery seeds, Wi-Fi codes, or private journals.
*   Data is encrypted at rest and only decrypted in memory when you view it.

### **4. 📋 Secure Clipboard**
The clipboard is a common security leak.
*   **Secure Paste:** Grabs text from your clipboard, encrypts it into a secure history, and **wipes** the OS clipboard immediately.
*   **Auto-Cleanup:** Automatically deletes history entries after a set time (e.g., 24 hours).

### **5. 🧹 Metadata Cleaner**
Photos and documents contain hidden data (Exif) that can reveal your location and identity.
*   **Scrub:** Remove GPS coordinates, Camera models, Authors, and Edit history from Images (JPG/PNG), PDFs, and Office Docs.
*   **Batch:** Drag & drop multiple files or folders to clean them instantly.

### **6. 📡 Breach Check**
Check if your password has appeared in known data leaks (850M+ records).
*   **Privacy Preserving:** Uses **k-Anonymity**. We send only the first 5 characters of the hash to the API. Your password is **never** sent to any server.

### **7. 🗑️ Secure Shredder (Desktop)**
When you delete a file, the data remains on your disk. The Shredder overwrites your files with random noise (DoD Standard 3-Pass) before deleting them.
*(Note: On Android, this performs a standard permanent delete due to hardware limitations).*

---

## 🛡️ Security Architecture

*   **Encryption:** AES-256-GCM (Authenticated Encryption).
*   **Key Derivation:** Argon2id (Resistant to GPU brute-force).
*   **Paranoid Mode:** Inject your own physical entropy (mouse movements/touch) to seed the random number generator.
*   **Panic Button:** `Ctrl+Shift+Q` instantly kills the app and wipes memory (Desktop).
*   **Auto-Lock:** Sessions timeout after 15 minutes of inactivity.

---

## 🚀 Getting Started

1.  **Create a Vault:** Set a strong Master Password.
2.  **Save your Recovery Code:** This is the *only* way to restore access if you forget your password.
3.  **Start using the tools:** Select a tool from the Home screen or Sidebar.

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
