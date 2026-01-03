import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { message } from "@tauri-apps/plugin-dialog";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // NEW: Keyfile State
  const [keyFile, setKeyFile] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Waiting for input...");
  const [statusType, setStatusType] = useState("");
  const [isParanoid, setIsParanoid] = useState(false);

  // 1. Select Target File
  async function selectTargetFile() {
    const selected = await open({ multiple: false });
    if (selected && typeof selected === "string") {
      setSelectedFile(selected);
      setStatus("File selected.");
      setStatusType("");
    }
  }

  // 2. Select Key File
  async function selectKeyFile() {
    const selected = await open({ multiple: false });
    if (selected && typeof selected === "string") {
      setKeyFile(selected);
    }
  }

  function generateBrowserEntropy(): number[] | null {
    if (!isParanoid) return null;
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array);
  }

  async function runAction(command: "lock_file" | "unlock_file") {
    if (!selectedFile) {
      setStatus("Please select a file to process.");
      setStatusType("error");
      return;
    }
    // Allow empty password ONLY if keyfile is present
    if (!password && !keyFile) {
      setStatus("Enter a password OR select a keyfile.");
      setStatusType("error");
      return;
    }

    setStatus("Processing... (Quantum-Resistant Engine)");
    setStatusType("");

    try {
      const entropy = command === "lock_file" ? generateBrowserEntropy() : null;

      const msg = await invoke(command, {
        filePath: selectedFile,
        password: password,
        keyfilePath: keyFile, // <--- Passing to Rust
        extraEntropy: entropy,
      });

      setStatus(msg as string);
      setStatusType("success");
    } catch (e) {
      setStatus("Error: " + e);
      setStatusType("error");
    }
  }

  async function handleAbout() {
    await message(
      "QRE v2.0\nAES-256-GCM + Kyber-1024\n\n- Multi-Factor Auth\n- Stateless Architecture\n- Auto-Renaming\n\nSecure. Local. Quantum-Ready.",
      { title: "About QRE" }
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <h1>QRE Locker</h1>
        </div>
        <div className="menu">
          <button
            className="menu-btn"
            onClick={() => openUrl("https://github.com/powergr/quantum-locker")}
          >
            GitHub
          </button>
          <span style={{ margin: "0 8px", color: "#555" }}>|</span>
          <button className="menu-btn" onClick={handleAbout}>
            About
          </button>
        </div>
      </div>

      <div className="card">
        {/* FILE SELECTION */}
        <div className="file-area">
          <button className="select-btn" onClick={selectTargetFile}>
            {selectedFile ? "Change File" : "Select File to Process"}
          </button>
          <div className="file-display" title={selectedFile || ""}>
            {selectedFile ? selectedFile : "No file selected"}
          </div>
        </div>

        {/* PASSWORD INPUT */}
        <div className="input-group">
          <input
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="Passphrase (Optional if Keyfile used)"
            type="password"
          />
        </div>

        {/* KEYFILE INPUT (NEW) */}
        <div className="file-area" style={{ marginTop: "5px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="select-btn"
              style={{ flex: 1, backgroundColor: "#414868", color: "#c0caf5" }}
              onClick={selectKeyFile}
            >
              🔑 Keyfile
            </button>
            {keyFile && (
              <button
                className="select-btn"
                style={{ backgroundColor: "#f7768e", width: "40px" }}
                onClick={() => setKeyFile(null)}
              >
                ✕
              </button>
            )}
          </div>
          <div
            className="file-display"
            style={{
              fontSize: "0.8rem",
              color: keyFile ? "#9ece6a" : "#565f89",
            }}
            title={keyFile || ""}
          >
            {keyFile
              ? `Using: ...${keyFile.slice(-20)}`
              : "(Optional) Select an image/file as a key"}
          </div>
        </div>

        {/* PARANOID TOGGLE */}
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={isParanoid}
            onChange={(e) => setIsParanoid(e.target.checked)}
          />
          <span>Paranoid Mode (Inject Extra Entropy)</span>
        </label>

        {/* ACTIONS */}
        <div className="actions">
          <button
            className="action-btn btn-lock"
            onClick={() => runAction("lock_file")}
          >
            <span>🔒</span> Lock
          </button>
          <button
            className="action-btn btn-unlock"
            onClick={() => runAction("unlock_file")}
          >
            <span>🔓</span> Unlock
          </button>
        </div>
      </div>

      <div className={`status-bar ${statusType}`}>{status}</div>
    </div>
  );
}

export default App;
