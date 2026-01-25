# QRE Privacy Toolkit User Manual

## Version 2.5.3

QRE Privacy Toolkit is a **Local-First**, **Zero-Knowledge** security suite. This means your data never leaves your device, we have no servers, and we cannot recover your password if you lose it. You are in complete control.

---

## 📖 Table of Contents

- [🔐 File Encryption](#file-encryption)
- [🔑 Password Vault](#password-vault)
- [📝 Secure Notes](#secure-notes)
- [📋 Secure Clipboard](#secure-clipboard)
- [🧹 Metadata Cleaner](#metadata-cleaner)
- [📡 Breach Check](#breach-check)
- [🗑️ Secure Shredder](#secure-shredder)
- [💾 Backup & Recovery](#backup-recovery)
- [⚙️ Advanced Settings](#advanced-settings)
- [🆘 Troubleshooting](#troubleshooting)

---

## 🔐 File Encryption

The core engine of QRE. Encrypt files of any size using military-grade **AES-256-GCM** wrapped in a custom, privacy-focused container.

### How to Lock
1.  Navigate to the **Files** tab.
2.  **Drag & Drop** files or folders into the window, or use the **"Select Keyfile"** menu to browse.
3.  Click the green **Lock** button.
4.  The original files remain untouched. New `.qre` encrypted files are created next to them.

### How to Unlock
1.  Drag a `.qre` file into the app.
2.  Click the red **Unlock** button.
3.  The file is decrypted and restored to its original location.

### Features
*   **Streaming Engine:** You can encrypt 100GB+ video files without crashing your computer or phone.
*   **Smart Compression:** The app automatically compresses documents (PDF, DOCX, TXT) to save space, while skipping already compressed media (MP4, JPG) for speed.
*   **Folder Support:** Dragging a folder automatically bundles it into a secure archive.

---

## 🔑 Password Vault

A secure, offline database for your logins. Unlike cloud password managers, this vault lives encrypted inside your local Keychain.

### Usage
*   **Add:** Click **"Add New"** to store a service, username, and password.
*   **Generate:** Click the **Key Icon** inside the password field to generate a strong, random password.
*   **Copy:** Click the **Copy Icon** to copy the password to your clipboard securely.
*   **View:** Click the **Eye Icon** to reveal the password.

### Security
Your vault is encrypted using your Master Password. If someone steals your computer, they cannot read your passwords without your Master Key.

---

## 📝 Secure Notes

A safe place for sensitive text that isn't just a password. Use this for:
*   Recovery Seeds (12/24 words)
*   Bank PINs
*   Private Diaries
*   Wi-Fi codes

### Usage
1.  Go to the **Notes** tab.
2.  Click **"New Note"**.
3.  Type your title and content.
4.  Click **Save**. The text is immediately encrypted and written to disk.

---

## 📋 Secure Clipboard

The clipboard is often a security leak. Other apps can read it, and Windows/macOS often sync it to the cloud.

### How it Works
1.  **Copy** sensitive text (e.g., an API Key or Credit Card number) from another app.
2.  Open QRE Toolkit and go to the **Clipboard** tab.
3.  Click **"Secure Paste"**.
    *   The app grabs the text from your clipboard.
    *   It analyzes it (tagging it as "Credit Card", "Crypto", etc.).
    *   It encrypts it into your secure history.
    *   **Crucially:** It wipes your operating system's clipboard so the secret is no longer exposed.

### Auto-Cleanup
You can set a retention timer (e.g., 1 Hour, 24 Hours) in the dropdown menu. Old clipboard entries are automatically permanently deleted after this time.

---

## 🧹 Metadata Cleaner

Photos and documents contain hidden data (Exif) that can reveal your location and identity. Use this tool before sharing files online.

### What gets removed?
*   **Images (JPG/PNG):** GPS Coordinates, Camera Model, Software Version, Date Taken, Author Name.
*   **Documents (PDF/Office):** Author Name, Edit History, Application Version.
*   **Archives (ZIP):** Repacks the zip to remove internal comments and timestamps.

### Usage
1.  Go to **Cleaner**.
2.  Drag files (or a folder of photos).
3.  Click **"Scrub Metadata"**.
4.  Clean copies are saved as `filename_clean.ext`.

---

## 📡 Breach Check

Check if your password has appeared in known data leaks (over 850 Million records).

### Privacy Guarantee (k-Anonymity)
We do **NOT** send your password to any server.
1.  We hash your password locally (SHA-1).
2.  We send only the *first 5 characters* of the hash to the API.
3.  The API returns hundreds of matches.
4.  Your computer checks locally if your full hash matches any of them.
**The server never knows what password you checked.**

---

## 🗑️ Secure Shredder

When you delete a file in Windows/macOS, it isn't gone; it's just hidden. The Shredder ensures data is unrecoverable.

### Desktop (Windows/Linux/macOS)
The app performs a **3-Pass Overwrite** (DoD Standard):
1.  Overwrites data with zeros.
2.  Overwrites data with ones.
3.  Overwrites data with random noise.
4.  Renames the file to a random ID.
5.  Deletes the file.

### Android
Due to the nature of Flash storage (Wear Leveling), secure overwriting damages the hardware and isn't guaranteed to work. On Android, this tool performs a standard permanent delete.

---

## 💾 Backup & Recovery

Your data relies on **keychain.json** stored in your app data folder. If your computer crashes or you uninstall the app on Android, **you lose your keys**.

### How to Backup
1.  Go to **Options -> Backup Keychain**.
2.  Save the `QRE_Backup.json` file.
3.  Store this file on a USB drive or a different cloud account.

### How to Restore
1.  Install QRE Toolkit on a new device.
2.  Locate the config folder (In Options -> About, or check system AppData).
3.  Replace the `keychain.json` with your backup.
4.  Login with your original password.

---

## ⚙️ Advanced Settings

### 🖱️ Paranoid Mode
Don't trust the computer's random number generator? Toggle this on.
The app will ask you to move your mouse (or touch the screen) to generate "Human Entropy." This physical chaos is used to seed the encryption keys.

### 📂 Keyfiles (2FA)
A Keyfile is a secondary physical key.
1.  Go to **Advanced -> Select Keyfile**.
2.  Choose *any* file (e.g., `MyPhoto.jpg`).
3.  **To Lock:** You need the Password + The Keyfile.
4.  **To Unlock:** You need the Password + The Keyfile.
If you lose the keyfile, the password alone is not enough.

### 🚨 Panic Button (Desktop)
Press **`Ctrl + Shift + Q`** at any time to instantly kill the app and wipe keys from memory. This works even if the app is minimized.

### ⏱️ Auto-Lock
If you are inactive for 15 minutes, the app will warn you and then automatically log out to protect your data.

---

## 🆘 Troubleshooting

**I forgot my Master Password.**
Use the **Recovery Code** (e.g., `QRE-XXXX...`) you saved during setup.
1. Click "Forgot Password?" on the login screen.
2. Enter the code.
3. Set a new password.
*If you lost your password AND your recovery code, your data is lost forever.*

**"Integrity Error"**
The file has been corrupted or modified by another program. QRE Toolkit refuses to decrypt it to prevent executing malicious code.

**"Validation Tag Mismatch"**
You entered the wrong password, or you are not using the correct Keyfile.
