# QRE Privacy Toolkit User Manual

## Version 2.5.4

QRE Privacy Toolkit is a **Local-First**, **Zero-Knowledge** security suite. This means your data never leaves your device, we have no servers, and we cannot recover your password if you lose it. You are in complete control.

---

## 📖 Table of Contents

- [🔐 File Encryption](#-file-encryption)
- [🔑 Password Vault](#-password-vault)
- [📝 Secure Notes](#-secure-notes)
- [🔖 Private Bookmarks](#-private-bookmarks)
- [📋 Secure Clipboard](#-secure-clipboard)
- [🧹 Metadata Cleaner](#-metadata-cleaner)
- [📡 Breach Check](#-breach-check)
- [🔳 Secure QR Generator](#-secure-qr-generator)
- [🗑️ Secure Shredder](#-secure-shredder)
- [💾 Backup & Recovery](#-backup--recovery)
- [⚙️ Advanced Settings](#-advanced-settings)
- [🆘 Troubleshooting](#-troubleshooting)

---

## 🔐 File Encryption

The core engine of QRE. Encrypt files of any size using military-grade **AES-256-GCM**.

### How to Lock

1. Navigate to the **Files** tab.
2. **Drag & Drop** files or folders into the window.
3. Click the green **Lock** button.
4. New `.qre` encrypted files are created next to the originals.

### How to Unlock

1. Drag a `.qre` file into the app.
2. Click the red **Unlock** button.

---

## 🔑 Password Vault

A secure, offline database for your logins.

**Add:** Click **"Add New"** to store a service, username, and password.
**Generate:** Click the **Key Icon** to create a strong password.
**Security:** Encrypted using your Master Password.

---

## 📝 Secure Notes

A safe place for sensitive text (Recovery Seeds, PINs, Diaries).
Data is encrypted on disk and only decrypted in memory when you view it.

---

## 🔖 Private Bookmarks

Store sensitive links (Banks, Medical Portals, Dark Web links) securely.

**Privacy:** Unlike browser bookmarks, these are encrypted on disk and never synced to the cloud.
**Usage:** Click "Open" to launch the link in your default browser.

---

## 📋 Secure Clipboard

Stop apps from reading your clipboard history.

1. **Copy** sensitive text from another app.
2. Click **"Secure Paste"** in QRE Toolkit.
3. The app encrypts the text into your vault and **wipes** the system clipboard immediately.

---

## 🧹 Metadata Cleaner

Remove hidden data (Exif) from photos and documents before sharing them.

**Removes:** GPS Coordinates, Camera Model, Author Name, Edit History.
**Supports:** JPG, PNG, PDF, DOCX, XLSX, PPTX, ZIP.

---

## 📡 Breach Check

Check if your password has appeared in known data leaks (850M+ records).

**Privacy:** We use k-Anonymity. Only the first 5 characters of the hash are sent to the API. Your password is never exposed.

---

## 🔳 Secure QR Generator

Share text, Wi-Fi credentials, or Crypto addresses with a phone offline.
The QR code is generated locally. No data is sent to any server.

---

## 🗑️ Secure Shredder

**Desktop:** Overwrites files 3 times (DoD Standard) before deletion to prevent recovery.
**Android:** Performs a standard delete (Flash memory cannot be securely shredded this way).

---

## 💾 Backup & Recovery

**Your data lives on your device.**

1. Go to **Options -> Backup Keychain**.
2. Save the `QRE_Backup.json` file to a secure USB drive.
3. **Restore:** Copy this file back to your app data folder to restore access on a new computer.

**Forgot Password?** Use the **Recovery Code** (`QRE-XXXX...`) saved during setup.

---

## ⚙️ Advanced Settings

**Paranoid Mode:** Inject mouse/touch entropy into encryption keys.
**Keyfiles:** Use a physical file (image/mp3) as a secondary key.
**Panic Button:** `Ctrl+Shift+Q` instantly kills the app.
**Auto-Lock:** Logs out after 15 minutes of inactivity.
