import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { generateBrowserEntropy } from "../utils/security";
import { BatchResult } from "../types"; // Import type

interface ProgressEvent {
  status: string;
  percentage: number;
}

export function useCrypto(reloadDir: () => void) {
  const [keyFile, setKeyFile] = useState<string | null>(null);
  const [isParanoid, setIsParanoid] = useState(false);
  const [compressionMode, setCompressionMode] = useState("normal");
  const [progress, setProgress] = useState<{
    status: string;
    percentage: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  function clearProgress(delay: number = 0) {
    if (delay > 0) setTimeout(() => setProgress(null), delay);
    else setProgress(null);
  }

  async function runCrypto(
    cmd: "lock_file" | "unlock_file",
    targets: string[]
  ) {
    if (targets.length === 0) {
      setErrorMsg("No files selected.");
      return;
    }

    setProgress({ status: "Preparing...", percentage: 0 });

    try {
      // Expect Structured Result
      const results = await invoke<BatchResult[]>(cmd, {
        filePaths: targets,
        keyfilePath: keyFile,
        extraEntropy:
          cmd === "lock_file" ? generateBrowserEntropy(isParanoid) : null,
        compressionMode: cmd === "lock_file" ? compressionMode : null,
      });

      // Analyze Result
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        // Build readable error report
        const report = failures
          .map((f) => `• ${f.name}: ${f.message}`)
          .join("\n");
        const successCount = results.length - failures.length;
        setErrorMsg(
          `Completed with errors (${successCount} succeeded, ${failures.length} failed):\n\n${report}`
        );
      }

      reloadDir();
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
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
