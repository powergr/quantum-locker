# QRE Locker User Manual

## Version 2.2.6

## 📖 Table of Contents

- [🚀 Quick Start](#quick-start)
- [💾 Backup & Restore](#backup-restore)
- [🚨 Panic Button](#panic-button)
- [⚙️ Advanced Features](#advanced-features)
- [🆘 Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

QRE Locker secures your files using a hybrid of **AES-256** and **Kyber-1024** (Post-Quantum).

### Locking & Unlocking

1. **Lock:** Drag & Drop files into the window and click **Lock**. The original files are securely wiped and replaced with `.qre` files.
2. **Unlock:** Select `.qre` files and click **Unlock**.

---

## 💾 Backup & Restore

Your encryption keys are stored in a local **Keychain**. If your computer breaks, you lose access.

### Create a Backup

1. Go to **Options > Backup Keychain**.
2. Save the `QRE_Backup.json` file to a secure USB drive or cloud storage.
3. **Note:** This backup is encrypted. You still need your Master Password to use it.

### Restore

1. Install QRE Locker on the new computer.
2. Close the app.
3. Copy your `QRE_Backup.json` to the config folder:
   - **Windows:** `%APPDATA%\qre\locker\config\`
   - **Linux:** `~/.config/qre/locker/`
4. Rename it to `keychain.json`.
5. Restart the app.

---

## 🚨 Panic Button

In an emergency, you can instantly secure the application.

**Shortcut:** `Ctrl + Shift + Q` (Windows/Linux) or `Cmd + Shift + Q` (macOS).
**Action:** Immediately wipes encryption keys from RAM and terminates the process.
**Result:** The app closes instantly. No data is saved/corrupted, but any active encryption job will stop.

---

## ⚙️ Advanced Features

### Keyfiles (2FA)

Acts like a physical key.

1. Go to **Advanced > Select Keyfile**.
2. Choose _any_ file. You must have this exact file to unlock your data later.

### Zip Options

- **Fast:** Low compression, high speed.
- **Normal:** Balanced.
- **Best:** Max compression, slower.

### Themes

Go to **Options > Theme** to switch between **Dark Mode**, **Light Mode**, or follow your **System** settings.

---

## 🆘 Troubleshooting

**I forgot my Master Password.**
Use the **Recovery Code** shown during setup. Click "Forgot Password?" on the login screen.

**"Access Denied"**
Ensure you have permission to write to the folder and the file is not open in another program.

---

**"Validation Tag Mismatch"**
This means the password or Keyfile is incorrect, or the file is corrupted.

---

## ⌨️ Shortcuts & Tricks

**Right Click** any file for a context menu (Rename, Delete, Reveal).
**Double Click** a folder to open it.
**Double Click** a `.qre` file in Windows Explorer to open QRE Locker automatically.

> **💡 Privacy Tip:** To hide filenames, put your files into a Folder and lock the Folder. The internal filenames will be completely hidden.
