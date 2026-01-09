import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ViewState } from "../types";
import { getPasswordScore } from "../utils/security";

type ActionResult = { success: boolean; msg?: string };

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

export function useAuth() {
  const [view, setView] = useState<ViewState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  // NEW: State to trigger the modal in App.tsx
  const [sessionExpired, setSessionExpired] = useState(false);

  const timerRef = useRef<number | null>(null);

  // --- AUTO LOCK LOGIC ---
  useEffect(() => {
    if (view !== "dashboard") {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);

      timerRef.current = window.setTimeout(() => {
        logout();
        setSessionExpired(true); // Trigger the modal state
      }, IDLE_TIMEOUT_MS);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [view]);

  // --- INIT ---
  useEffect(() => {
    async function init() {
      try {
        const status = await invoke("check_auth_status");
        if (status === "unlocked") setView("dashboard");
        else if (status === "setup_needed") setView("setup");
        else setView("login");
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  async function handleInit(): Promise<ActionResult> {
    if (getPasswordScore(password) < 3)
      return { success: false, msg: "Password too weak." };
    if (password !== confirmPass)
      return { success: false, msg: "Passwords do not match." };
    try {
      const code = (await invoke("init_vault", { password })) as string;
      setRecoveryCode(code);
      setView("recovery_display");
      return { success: true };
    } catch (e) {
      return { success: false, msg: String(e) };
    }
  }

  async function handleLogin(): Promise<ActionResult> {
    try {
      await invoke("login", { password });
      setPassword("");
      setView("dashboard");
      setSessionExpired(false); // Reset on new login
      return { success: true };
    } catch (e) {
      return { success: false, msg: String(e) };
    }
  }

  async function handleRecovery(): Promise<ActionResult> {
    if (!recoveryCode || password !== confirmPass)
      return { success: false, msg: "Check inputs." };
    try {
      await invoke("recover_vault", {
        recoveryCode: recoveryCode.trim(),
        newPassword: password,
      });
      setPassword("");
      setConfirmPass("");
      setRecoveryCode("");
      setView("dashboard");
      setSessionExpired(false);
      return { success: true, msg: "Vault recovered." };
    } catch (e) {
      return { success: false, msg: String(e) };
    }
  }

  async function handleChangePassword(): Promise<ActionResult> {
    if (password !== confirmPass) return { success: false, msg: "Mismatch." };
    if (getPasswordScore(password) < 3)
      return { success: false, msg: "Weak Password." };
    try {
      await invoke("change_user_password", { newPassword: password });
      setPassword("");
      setConfirmPass("");
      return { success: true, msg: "Password updated." };
    } catch (e) {
      return { success: false, msg: String(e) };
    }
  }

  async function handleReset2FA(): Promise<ActionResult> {
    try {
      const code = (await invoke("regenerate_recovery_code")) as string;
      setRecoveryCode(code);
      setView("recovery_display");
      return { success: true };
    } catch (e) {
      return { success: false, msg: String(e) };
    }
  }

  async function logout() {
    await invoke("logout");
    setView("login");
    setPassword("");
  }

  return {
    view,
    setView,
    password,
    setPassword,
    confirmPass,
    setConfirmPass,
    recoveryCode,
    setRecoveryCode,
    sessionExpired,
    setSessionExpired, // Exported
    handleInit,
    handleLogin,
    handleRecovery,
    handleChangePassword,
    handleReset2FA,
    logout,
  };
}
