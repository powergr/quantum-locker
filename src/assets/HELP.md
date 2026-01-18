# QRE Toolkit User Manual

## Version 2.5.0

## 📖 Table of Contents

- [🔐 File Encryption](#file-encryption)
- [🗑️ Secure Shredder](#secure-shredder)
- [🔑 Password Vault](#password-vault)
- [💾 Backup & Recovery](#backup--recovery)
- [⚙️ Settings](#settings)

---

## 🔐 File Encryption

The core feature of QRE. Protect your files from prying eyes.

1. Go to the **Encrypt** tab.
2. **Drag & Drop** files or folders.
3. Click **Lock** to encrypt (creates `.qre` files).
4. Click **Unlock** to restore original files.

**Note:** The app uses streaming, so you can encrypt files of any size (even 100GB+) without slowing down your device.

---

## 🗑️ Secure Shredder

Use this when you want a file gone forever (e.g., before selling a laptop).

1. Go to the **Shredder** tab.
2. Drag sensitive files into the drop zone.
3. Click **Shred Files Forever**.

**Desktop:** Files are overwritten with random data 3 times before deletion.
**Android:** Files are deleted normally (Flash memory cannot be securely shredded this way).

---

## 🔑 Password Vault

A simple, offline manager for your secrets.

1. Go to the **Passwords** tab.
2. Click **New Item** to add a login, note, or recovery code.
3. Click the **Eye** icon to reveal, or the **Copy** icon to copy to clipboard.

**Security:** This vault is encrypted inside your Keychain. It is never synced to the cloud.

---

## 💾 Backup & Recovery

**Your data lives on your device.** If you lose your computer/phone, you lose your data unless you have a backup.

1. Go to **Options > Backup Keychain**.
2. Save the `QRE_Backup.json` file to a secure USB drive or cloud storage.
3. To restore, copy this file back into the app's data folder (or use Import in future versions).

**Forgot Password?**
Use the **Recovery Code** (`QRE-XXXX...`) you saved during setup to reset your password.

---

## ⚙️ Settings

**Paranoid Mode:** Adds mouse/touch randomness to encryption keys.

**Zip Compression:** Set to "Auto" for best performance.

**Theme:** Switch between Dark/Light mode.

**Panic Button:** Press `Ctrl+Shift+Q` (Desktop) to instantly lock and exit.
