import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readDir, stat } from "@tauri-apps/plugin-fs";
import { documentDir } from "@tauri-apps/api/path";
import { message, open } from "@tauri-apps/plugin-dialog";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import zxcvbn from "zxcvbn";
import "./App.css";

// Icons
import {
  Lock,
  Unlock,
  Folder,
  File,
  ArrowUp,
  RefreshCw,
  Settings,
  LogOut,
  Info,
  AlertTriangle,
  HardDrive,
  Key,
  Shield,
  X,
  Sliders,
} from "lucide-react";

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
  isDrive?: boolean;
  size: number | null;
  modified: Date | null;
}

type ViewState =
  | "loading"
  | "setup"
  | "recovery_display"
  | "recovery_entry"
  | "login"
  | "dashboard";

function App() {
  const [view, setView] = useState<ViewState>("loading");

  // Auth Inputs
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  // File Manager State
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState("Ready");

  // Settings / Crypto State
  const [keyFile, setKeyFile] = useState<string | null>(null);
  const [isParanoid, setIsParanoid] = useState(false);

  // UI Toggles
  const [showMenu, setShowMenu] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false); // New Menu State
  const [showAbout, setShowAbout] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  function formatSize(bytes: number | null) {
    if (bytes === null) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDate(date: Date | null) {
    if (!date) return "";
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "#f7768e";
      case 1:
        return "#ff9e64";
      case 2:
        return "#e0af68";
      case 3:
        return "#9ece6a";
      case 4:
        return "#73daca";
      default:
        return "transparent";
    }
  };

  function generateBrowserEntropy(): number[] | null {
    if (!isParanoid) return null;
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array);
  }

  // --- Init ---
  useEffect(() => {
    checkAuth();
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node)
      ) {
        setShowAdvancedMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function checkAuth() {
    try {
      const status = await invoke("check_auth_status");
      if (status === "unlocked") {
        setView("dashboard");
        loadInitialPath();
      } else if (status === "setup_needed") setView("setup");
      else setView("login");
    } catch (e) {
      console.error(e);
    }
  }

  async function loadInitialPath() {
    try {
      const docs = await documentDir();
      loadDir(docs);
    } catch (e) {
      loadDir("");
    }
  }

  // --- File System ---
  async function loadDir(path: string) {
    try {
      if (path === "") {
        const drives = await invoke<string[]>("get_drives");
        const mapped: FileEntry[] = drives.map((d) => ({
          name: d,
          isDirectory: true,
          path: d,
          isDrive: true,
          size: null,
          modified: null,
        }));
        setEntries(mapped);
        setCurrentPath("");
        setSelectedPaths([]);
        setStatusMsg("Select a Drive");
        return;
      }

      const contents = await readDir(path);
      const separator = navigator.userAgent.includes("Windows") ? "\\" : "/";

      const mapped = await Promise.all(
        contents.map(async (entry) => {
          const cleanPath = path.endsWith(separator) ? path : path + separator;
          const fullPath = `${cleanPath}${entry.name}`;

          let size = null;
          let modified = null;
          if (!entry.isDirectory) {
            try {
              const metadata = await stat(fullPath);
              size = metadata.size;
              if (metadata.mtime) modified = new Date(metadata.mtime);
            } catch (e) {
              /* ignore access errors */
            }
          }

          return {
            name: entry.name,
            isDirectory: entry.isDirectory,
            path: fullPath,
            size,
            modified,
          };
        })
      );

      mapped.sort((a, b) => {
        if (a.isDirectory === b.isDirectory)
          return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });

      setEntries(mapped);
      setCurrentPath(path);
      setSelectedPaths([]);
      setStatusMsg(`Loaded: ${path}`);
    } catch (e) {
      setStatusMsg("Access Denied.");
    }
  }

  function goUp() {
    if (currentPath === "") return;
    const separator = navigator.userAgent.includes("Windows") ? "\\" : "/";
    if (currentPath.length <= 3 && currentPath.includes(":")) {
      loadDir("");
      return;
    }
    if (currentPath === "/") {
      loadDir("");
      return;
    }

    const parts = currentPath.split(separator).filter((p) => p);
    parts.pop();
    if (parts.length === 0) {
      if (navigator.userAgent.includes("Windows")) loadDir("");
      else loadDir("/");
      return;
    }
    let parent = parts.join(separator);
    if (
      navigator.userAgent.includes("Windows") &&
      parent.length === 2 &&
      parent.endsWith(":")
    )
      parent += separator;
    loadDir(parent);
  }

  // --- Actions ---
  async function handleInit() {
    if (zxcvbn(password).score < 3)
      return message("Password too weak.", {
        title: "Security Warning",
        kind: "warning",
      });
    if (password !== confirmPass)
      return message("Passwords do not match.", {
        title: "Error",
        kind: "error",
      });
    try {
      const code = await invoke("init_vault", { password });
      setRecoveryCode(code as string);
      setView("recovery_display");
    } catch (e) {
      message(String(e), { kind: "error" });
    }
  }

  async function handleLogin() {
    try {
      await invoke("login", { password });
      setPassword("");
      setView("dashboard");
      loadInitialPath();
    } catch (e) {
      message(String(e), { title: "Login Failed", kind: "error" });
    }
  }

  async function handleRecovery() {
    if (!recoveryCode || password !== confirmPass)
      return message("Check inputs.", { kind: "error" });
    try {
      await invoke("recover_vault", {
        recoveryCode: recoveryCode.trim(),
        newPassword: password,
      });
      setPassword("");
      setConfirmPass("");
      setRecoveryCode("");
      setView("dashboard");
      loadInitialPath();
      message("Vault recovered successfully.", { kind: "info" });
    } catch (e) {
      message(String(e), { kind: "error" });
    }
  }

  async function handleReset2FAConfirm() {
    try {
      const code = await invoke("regenerate_recovery_code");
      setRecoveryCode(code as string);
      setView("recovery_display");
      setShowResetConfirm(false);
    } catch (e) {
      message(String(e), { kind: "error" });
    }
  }

  async function handleChangePassword() {
    if (password !== confirmPass) {
      await message("Mismatch.", { kind: "error" });
      return;
    }
    if (zxcvbn(password).score < 3) {
      await message("Weak Password.", { kind: "warning" });
      return;
    }
    try {
      await invoke("change_user_password", { newPassword: password });
      setPassword("");
      setConfirmPass("");
      setShowChangePass(false);
      message("Password updated.", { kind: "info" });
    } catch (e) {
      message(String(e), { kind: "error" });
    }
  }

  async function handleLogout() {
    await invoke("logout");
    setView("login");
    setPassword("");
    setKeyFile(null); // Reset security settings
    setIsParanoid(false);
    setSelectedPaths([]);
    setShowMenu(false);
  }

  async function selectKeyFile() {
    const selected = await open({ multiple: false });
    if (selected && typeof selected === "string") {
      setKeyFile(selected);
      setShowAdvancedMenu(false);
    }
  }

  async function runCrypto(cmd: "lock_file" | "unlock_file") {
    if (selectedPaths.length === 0) return setStatusMsg("No files selected.");
    setStatusMsg("Processing...");
    try {
      await invoke(cmd, {
        filePaths: selectedPaths,
        keyfilePath: keyFile,
        extraEntropy: cmd === "lock_file" ? generateBrowserEntropy() : null,
      });
      setStatusMsg("Done.");
      loadDir(currentPath);
    } catch (e) {
      setStatusMsg("Error: " + e);
      message(String(e), { kind: "error" });
    }
  }

  // --- RENDER ---
  if (view === "loading") return <div className="auth-overlay">Loading...</div>;

  // 1. Auth Views (CENTERED)
  if (["setup", "login", "recovery_entry", "recovery_display"].includes(view)) {
    let title = "Unlock Vault";
    if (view === "setup") title = "Setup QRE";
    if (view === "recovery_entry") title = "Recovery";
    if (view === "recovery_display") title = "Recovery Code";

    const score =
      (view === "setup" || view === "recovery_entry") && password
        ? zxcvbn(password).score
        : -1;

    return (
      <div className="auth-overlay">
        <div className="auth-card">
          <div className="modal-header">
            <Shield size={20} color="var(--accent)" />
            <h2>{title}</h2>
          </div>

          <div className="modal-body">
            {view === "recovery_display" ? (
              <>
                <p style={{ color: "var(--warning)", textAlign: "center" }}>
                  SAVE THIS CODE SECURELY
                </p>
                <div className="recovery-box">
                  <div className="recovery-code">{recoveryCode}</div>
                </div>
                <p
                  style={{
                    color: "#ccc",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  It is the ONLY way to recover your data if you forget your
                  password.
                </p>
                <button
                  className="auth-btn"
                  onClick={() => setView("dashboard")}
                >
                  I have saved it
                </button>
              </>
            ) : (
              <>
                {view === "recovery_entry" && (
                  <input
                    className="auth-input"
                    placeholder="Recovery Code (QRE-...)"
                    onChange={(e) => setRecoveryCode(e.target.value)}
                  />
                )}

                <input
                  type="password"
                  className="auth-input"
                  placeholder={
                    view === "login" ? "Master Password" : "New Password"
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (view === "login" ? handleLogin() : null)
                  }
                />

                {(view === "setup" || view === "recovery_entry") && (
                  <>
                    {score >= 0 && (
                      <div style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <div
                          style={{
                            height: "4px",
                            width: "100%",
                            background: "#2f3448",
                            borderRadius: "2px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${(score + 1) * 20}%`,
                              background: getStrengthColor(score),
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Confirm Password"
                      onChange={(e) => setConfirmPass(e.target.value)}
                    />
                  </>
                )}

                <button
                  className="auth-btn"
                  onClick={() => {
                    if (view === "setup") handleInit();
                    else if (view === "recovery_entry") handleRecovery();
                    else handleLogin();
                  }}
                >
                  {view === "setup"
                    ? "Initialize"
                    : view === "recovery_entry"
                    ? "Reset & Login"
                    : "Unlock"}
                </button>

                {view === "login" && (
                  <div style={{ textAlign: "center", marginTop: 10 }}>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#888",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => setView("recovery_entry")}
                    >
                      Forgot Password?
                    </span>
                  </div>
                )}
                {view === "recovery_entry" && (
                  <button
                    className="secondary-btn"
                    onClick={() => setView("login")}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Dashboard
  return (
    <div className="main-layout">
      {/* Toolbar */}
      <div className="toolbar">
        <button
          className="tool-btn success"
          onClick={() => runCrypto("lock_file")}
        >
          <Lock />
          <span>Lock</span>
        </button>
        <button
          className="tool-btn danger"
          onClick={() => runCrypto("unlock_file")}
        >
          <Unlock />
          <span>Unlock</span>
        </button>
        <div
          style={{ width: 1, height: 40, background: "#333", margin: "0 10px" }}
        ></div>
        <button className="tool-btn" onClick={() => loadDir(currentPath)}>
          <RefreshCw />
          <span>Refresh</span>
        </button>

        <div style={{ flex: 1 }}></div>

        {/* NEW: Advanced Menu */}
        <div
          className="dropdown-container"
          ref={advancedRef}
          style={{ marginRight: 10 }}
        >
          <button
            className={`tool-btn ${
              keyFile || isParanoid ? "active-settings" : ""
            }`}
            onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
          >
            <Sliders />
            <span>Advanced</span>
            {(keyFile || isParanoid) && <div className="indicator-dot"></div>}
          </button>

          {showAdvancedMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={selectKeyFile}>
                <Key
                  size={16}
                  color={keyFile ? "var(--btn-success)" : "currentColor"}
                />
                {keyFile ? "Keyfile Active" : "Select Keyfile"}
              </div>
              {keyFile && (
                <div
                  className="dropdown-item danger"
                  onClick={() => setKeyFile(null)}
                  style={{ fontSize: "0.8rem", paddingLeft: "36px" }}
                >
                  Clear Keyfile
                </div>
              )}
              <div className="dropdown-divider"></div>
              <div
                className="dropdown-item"
                onClick={() => setIsParanoid(!isParanoid)}
              >
                <div style={{ width: 20, textAlign: "center" }}>
                  {isParanoid && "✓"}
                </div>
                Paranoid Mode
              </div>
            </div>
          )}
        </div>

        {/* Options Menu */}
        <div className="dropdown-container" ref={menuRef}>
          <button className="tool-btn" onClick={() => setShowMenu(!showMenu)}>
            <Settings />
            <span>Options</span>
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowChangePass(true);
                }}
              >
                <Key size={16} /> Change Password
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowResetConfirm(true);
                }}
              >
                <AlertTriangle size={16} color="var(--warning)" /> Reset 2FA
                Code
              </div>
              <div className="dropdown-divider"></div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowAbout(true);
                }}
              >
                <Info size={16} /> About
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  openUrl("https://github.com/powergr/quantum-locker/");
                }}
              >
                <Folder size={16} /> GitHub
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} /> Log Out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Bar */}
      <div className="address-bar">
        <button className="nav-btn" onClick={goUp}>
          <ArrowUp size={18} />
        </button>
        <input className="path-input" value={currentPath} readOnly />
      </div>

      {/* File Grid */}
      <div className="file-view">
        <div className="file-header">
          <div></div>
          <div>Name</div>
          <div>Type</div>
          <div>Size</div>
          <div>Date</div>
        </div>
        {entries.map((e, i) => (
          <div
            key={i}
            className={`file-row ${
              selectedPaths.includes(e.path) ? "selected" : ""
            }`}
            onClick={(ev) => {
              if (ev.ctrlKey)
                setSelectedPaths((prev) =>
                  prev.includes(e.path)
                    ? prev.filter((p) => p !== e.path)
                    : [...prev, e.path]
                );
              else setSelectedPaths([e.path]);
            }}
            onDoubleClick={() => e.isDirectory && loadDir(e.path)}
          >
            <div className="icon">
              {e.isDrive ? (
                <HardDrive size={16} stroke="#7aa2f7" />
              ) : e.isDirectory ? (
                <Folder size={16} stroke="#e0af68" />
              ) : (
                <File size={16} />
              )}
            </div>
            <div className="name">{e.name}</div>
            <div className="details">
              {e.isDirectory
                ? "Folder"
                : e.name.split(".").pop()?.toUpperCase()}
            </div>
            <div className="details">{formatSize(e.size)}</div>
            <div className="details">{formatDate(e.modified)}</div>
          </div>
        ))}
      </div>

      <div className="status-bar">
        {statusMsg} | {selectedPaths.length} selected
      </div>

      {/* --- Modals --- */}

      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Info size={20} color="var(--accent)" />
              <h2>About QRE Locker</h2>
              <div style={{ flex: 1 }}></div>
              <X
                size={20}
                style={{ cursor: "pointer" }}
                onClick={() => setShowAbout(false)}
              />
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <p>
                <strong>Version 2.2.1</strong>
              </p>
              <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                Securing your files with AES-256-GCM and Post-Quantum
                Kyber-1024.
              </p>
              {/* FIXED: Button text is now "Close" */}
              <button
                className="secondary-btn"
                onClick={() => setShowAbout(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Reset Confirmation */}
      {showResetConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowResetConfirm(false)}
        >
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle size={20} color="var(--warning)" />
              <h2>Reset Recovery Code?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: "#ccc" }}>
                This will invalidate your old code immediately. You must
                print/save the new one.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {/* FIXED: White text on Warning background */}
                <button
                  className="auth-btn"
                  style={{ background: "var(--warning)", color: "white" }}
                  onClick={handleReset2FAConfirm}
                >
                  Confirm Reset
                </button>
                <button
                  className="secondary-btn"
                  style={{ flex: 1 }}
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePass && (
        <div className="modal-overlay">
          <div className="auth-card">
            <div className="modal-header">
              <Key size={20} color="var(--accent)" />
              <h2>Change Password</h2>
            </div>
            <div className="modal-body">
              <input
                type="password"
                className="auth-input"
                placeholder="New Password"
                onChange={(e) => setPassword(e.target.value)}
              />

              {password && (
                <div style={{ marginTop: "5px", marginBottom: "5px" }}>
                  <div
                    style={{
                      height: "4px",
                      width: "100%",
                      background: "#2f3448",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(zxcvbn(password).score + 1) * 20}%`,
                        background: getStrengthColor(zxcvbn(password).score),
                      }}
                    />
                  </div>
                </div>
              )}

              <input
                type="password"
                className="auth-input"
                placeholder="Confirm"
                onChange={(e) => setConfirmPass(e.target.value)}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="auth-btn"
                  style={{ flex: 1 }}
                  onClick={() => handleChangePassword()}
                >
                  Update
                </button>
                <button
                  className="secondary-btn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowChangePass(false);
                    setPassword("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
