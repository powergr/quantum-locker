import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ViewState } from "../types";
import { getPasswordScore } from "../utils/security";

type ActionResult = { success: boolean; msg?: string };

// Configuration
const WARNING_DELAY_MS = 14 * 60 * 1000; // Show warning after 14 mins
const COUNTDOWN_SECONDS = 60; // Count down for 60s

export function useAuth() {
  const [view, setView] = useState<ViewState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  const [sessionExpired, setSessionExpired] = useState(false);

  // NEW: Warning State
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const idleTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // --- AUTO LOCK LOGIC ---

  // Function to reset the idle timer (called on user activity)
  const resetIdleTimer = () => {
    // 1. Clear existing timers
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current)
      window.clearInterval(countdownIntervalRef.current);

    // 2. Reset State
    setShowTimeoutWarning(false);
    setCountdown(COUNTDOWN_SECONDS);

    // 3. Start new Warning Timer
    if (view === "dashboard") {
      idleTimerRef.current = window.setTimeout(() => {
        triggerWarning();
      }, WARNING_DELAY_MS);
    }
  };

  // Triggered when 14 mins have passed
  const triggerWarning = () => {
    setShowTimeoutWarning(true);

    // Start countdown tick
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time is up!
          performLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const performLogout = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current)
      window.clearInterval(countdownIntervalRef.current);

    logout();
    setShowTimeoutWarning(false);
    setSessionExpired(true);
  };

  // Activity Listeners
  useEffect(() => {
    if (view !== "dashboard") return;

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);

    resetIdleTimer(); // Start initial timer

    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current)
        window.clearInterval(countdownIntervalRef.current);
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
      setSessionExpired(false);
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
    setShowTimeoutWarning(false);
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
    setSessionExpired,

    // Export new state
    showTimeoutWarning,
    countdown,
    stayLoggedIn: resetIdleTimer, // Helper to manually reset

    handleInit,
    handleLogin,
    handleRecovery,
    handleChangePassword,
    handleReset2FA,
    logout,
  };
}
