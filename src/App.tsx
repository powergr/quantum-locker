import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import "./App.css";
// Load split styles
import "./styles/components.css";
import "./styles/dashboard.css";
import "./components/layout/Sidebar.css";
import "./components/views/ShredderView.css";
import "./components/views/VaultView.css";

// Hooks
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";

// Components (Layout & Views)
import { Sidebar } from "./components/layout/Sidebar";
import { HomeView } from "./components/views/HomeView";
import { FilesView } from "./components/views/FilesView";
import { ShredderView } from "./components/views/ShredderView";
import { VaultView } from "./components/views/VaultView";

// Auth & Modals
import { AuthOverlay } from "./components/auth/AuthOverlay";
import { HelpModal } from "./components/modals/HelpModal";
import {
  AboutModal,
  ResetConfirmModal,
  ChangePassModal,
  ThemeModal,
  BackupModal,
  InfoModal,
  TimeoutWarningModal,
} from "./components/modals/AppModals";

function App() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();

  // --- GLOBAL STATE ---
  // Default to "home" so the user sees the dashboard landing page first
  const [activeTab, setActiveTab] = useState("home");

  // Modals that can be triggered from anywhere
  const [showAbout, setShowAbout] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // --- GLOBAL HELPERS ---

  // Handles the Backup Keychain logic (available from Toolbar in FilesView)
  async function performBackup() {
    setShowBackupModal(false);
    try {
      const path = await save({
        filters: [{ name: "QRE Keychain", extensions: ["json"] }],
        defaultPath: "QRE_Backup.json",
      });

      if (path) {
        // 1. Get bytes from Rust (Works on Android/Desktop)
        const bytes = await invoke<number[]>("get_keychain_data");
        // 2. Write using JS Plugin (Works with Android Content URIs)
        await writeFile(path, Uint8Array.from(bytes));
        setInfoMsg("Backup saved successfully.\nKeep it safe!");
      }
    } catch (e) {
      setInfoMsg("Backup failed: " + String(e));
    }
  }

  // --- AUTH SCREEN RENDERING ---
  // If not authenticated, show the Setup/Login screens
  if (
    [
      "loading",
      "setup",
      "login",
      "recovery_entry",
      "recovery_display",
    ].includes(auth.view)
  ) {
    return (
      <>
        {auth.sessionExpired && (
          <InfoModal
            message="Session timed out due to inactivity."
            onClose={() => auth.setSessionExpired(false)}
          />
        )}
        <AuthOverlay
          view={auth.view}
          password={auth.password}
          setPassword={auth.setPassword}
          confirmPass={auth.confirmPass}
          setConfirmPass={auth.setConfirmPass}
          recoveryCode={auth.recoveryCode}
          setRecoveryCode={auth.setRecoveryCode}
          onLogin={async () => {
            const res = await auth.handleLogin();
            if (!res.success) setInfoMsg(res.msg || "Login failed");
          }}
          onInit={async () => {
            const res = await auth.handleInit();
            if (!res.success) setInfoMsg(res.msg || "Setup failed");
          }}
          onRecovery={async () => {
            const res = await auth.handleRecovery();
            if (!res.success) setInfoMsg(res.msg || "Recovery failed");
            else setInfoMsg("Vault recovered successfully.");
          }}
          onAckRecoveryCode={() => auth.setView("dashboard")}
          onSwitchToRecovery={() => auth.setView("recovery_entry")}
          onCancelRecovery={() => auth.setView("login")}
        />
        {infoMsg && (
          <InfoModal message={infoMsg} onClose={() => setInfoMsg(null)} />
        )}
      </>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <div className="app-container">
      {/* 1. PASS GLOBAL HANDLERS TO SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setTab={setActiveTab}
        onOpenHelpModal={() => setShowHelpModal(true)}
        onOpenAboutModal={() => setShowAbout(true)}
        onLogout={auth.logout}
        // NEW HANDLERS MOVED HERE
        onTheme={() => setShowThemeModal(true)}
        onBackup={() => setShowBackupModal(true)}
        onChangePassword={() => setShowChangePass(true)}
        onReset2FA={() => setShowResetConfirm(true)}
      />

      <div className="content-area">
        {activeTab === "home" && <HomeView setTab={setActiveTab} />}

        {activeTab === "files" && <FilesView />}

        {activeTab === "shred" && <ShredderView />}
        {activeTab === "vault" && <VaultView />}
      </div>

      {/* --- GLOBAL MODALS --- */}
      {showThemeModal && (
        <ThemeModal
          currentTheme={theme}
          onSave={(t) => {
            setTheme(t);
            setShowThemeModal(false);
          }}
          onCancel={() => setShowThemeModal(false)}
        />
      )}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showBackupModal && (
        <BackupModal
          onProceed={performBackup}
          onCancel={() => setShowBackupModal(false)}
        />
      )}
      {auth.showTimeoutWarning && (
        <TimeoutWarningModal
          seconds={auth.countdown}
          onStay={auth.stayLoggedIn}
        />
      )}

      {showResetConfirm && (
        <ResetConfirmModal
          onConfirm={async () => {
            const res = await auth.handleReset2FA();
            if (!res.success) setInfoMsg(res.msg || "Reset failed");
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showChangePass && (
        <ChangePassModal
          pass={auth.password}
          setPass={auth.setPassword}
          confirm={auth.confirmPass}
          setConfirm={auth.setConfirmPass}
          onUpdate={async () => {
            const res = await auth.handleChangePassword();
            if (!res.success) setInfoMsg(res.msg || "Update failed");
            else {
              setInfoMsg("Password updated successfully.");
              setShowChangePass(false);
            }
          }}
          onCancel={() => {
            setShowChangePass(false);
            auth.setPassword("");
          }}
        />
      )}

      {infoMsg && (
        <InfoModal message={infoMsg} onClose={() => setInfoMsg(null)} />
      )}
    </div>
  );
}

export default App;
