import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { generateBrowserEntropy } from "../utils/security";

interface ProgressEvent {
  status: string;
  percentage: number;
}

export function useCrypto(reloadDir: () => void) {
  // Settings
  const [keyFile, setKeyFile] = useState<string | null>(null);
  const [isParanoid, setIsParanoid] = useState(false);
  const [compressionMode, setCompressionMode] = useState("normal");

  // Progress State
  const [progress, setProgress] = useState<{
    status: string;
    percentage: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Listen for backend progress
  useEffect(() => {
    const unlisten = listen<ProgressEvent>("qre:progress", (event) => {
      setProgress({
        status: event.payload.status,
        percentage: event.payload.percentage,
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  async function selectKeyFile() {
    const selected = await open({ multiple: false });
    if (typeof selected === "string") setKeyFile(selected);
  }

  // FIXED: Added delay support to handle race conditions
  function clearProgress(delay: number = 0) {
    if (delay > 0) {
      setTimeout(() => setProgress(null), delay);
    } else {
      setProgress(null);
    }
  }

  async function runCrypto(
    cmd: "lock_file" | "unlock_file",
    targets: string[]
  ) {
    if (targets.length === 0) {
      setErrorMsg("No files selected.");
      return;
    }

    // Init Progress
    setProgress({ status: "Preparing...", percentage: 0 });

    try {
      await invoke(cmd, {
        filePaths: targets,
        keyfilePath: keyFile,
        extraEntropy:
          cmd === "lock_file" ? generateBrowserEntropy(isParanoid) : null,
        compressionMode: cmd === "lock_file" ? compressionMode : null,
      });
      reloadDir();
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      // Use delay here too for consistency
      clearProgress(500);
    }
  }

  return {
    keyFile,
    setKeyFile,
    selectKeyFile,
    isParanoid,
    setIsParanoid,
    compressionMode,
    setCompressionMode,
    progress,
    errorMsg,
    setErrorMsg,
    clearProgress,
    runCrypto,
  };
}
