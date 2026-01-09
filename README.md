# QRE Locker (v2.2.5)

**A Modern, Quantum-Resistant File Encryption Tool.**

QRE Locker is a cross-platform desktop application designed to secure your data against both modern cyber threats and future quantum computing attacks. It combines the speed of **AES-256-GCM** with the post-quantum security of **ML-KEM-1024 (Kyber)** in a user-friendly, local-first interface.

![Screenshot](qrev2.jpg)

## 🚀 Key Features

- **⚡ Native Performance:** Written in **Rust** (Tauri v2) for memory safety and blazing speed.
- **🛡️ Post-Quantum Crypto:** Uses Kyber-1024 to wrap keys, protecting against future quantum computer attacks.
- **🚨 Panic Button:** Global hotkey (`Ctrl+Shift+Q`) to instantly wipe keys from RAM and kill the application.
- **🎨 Themes:** Support for **Dark**, **Light**, and **System** modes.
- **💾 Secure Backup:** Export your keychain securely to restore access on other devices.
- **🗑️ Secure Shredding:** Deleting files inside the app overwrites them with random data before unlinking.
- **🗜️ Smart Compression:** Customizable Zip levels (Fast, Normal, Best).
- **📂 Folder Support:** Drag and drop entire directories to encrypt them as a single package.

## 📦 Installation

Download the latest installer for your operating system from the [Releases Page](https://github.com/powergr/quantum-locker/releases).

- **Windows:** `.exe` (Installer)
- **Linux:** `.deb` or `.AppImage`
- **macOS:** `.dmg`

> **Note:** As this is open-source software, the installer is self-signed. You may need to click "Run Anyway" if prompted by security filters.

## 📖 User Guide

### 1. Setup & Backup

On first launch, create a **Master Password**.

**Recovery Code:** Save the displayed code (e.g., `QRE-A1...`). It is your only way back if you forget the password.
**Backup:** Go to **Options > Backup Keychain** and save the JSON file to a USB drive. This file + your password can restore your account on any computer.

### 2. Locking & Unlocking

**Lock:** Drag files into the window or use **Right Click > Lock**. Original files are shredded; encrypted `.qre` files are created.
**Unlock:** Select `.qre` files and click **Unlock**.
**Double-Click:** You can double-click a `.qre` file in your OS File Manager to open it directly in QRE Locker.

### 3. Advanced Security

**Keyfile:** (Optional) Go to **Advanced** to select a file (image/song) as a second factor. You must have this file present to unlock your data.
**Paranoid Mode:** Injects mouse movement entropy into the key generation.
**Panic Button:** Press **`Ctrl + Shift + Q`** at any time to instantly terminate the app and wipe memory.

## 🛠️ Development

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
  **Windows:** C++ Build Tools
  **Linux:** `libwebkit2gtk-4.1-dev`, `build-essential`

### Build

```bash
# Install dependencies
npm install

# Run in Dev Mode
npm run tauri dev

# Build Release
npm run tauri build
```

---

**License:** MIT License. See [LICENSE](LICENSE) file.
