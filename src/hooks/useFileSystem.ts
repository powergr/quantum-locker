import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readDir, stat } from "@tauri-apps/plugin-fs";
import { homeDir } from "@tauri-apps/api/path";
import { FileEntry } from "../types";

export function useFileSystem(view: string) {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  // Check for startup args (File Association)
  useEffect(() => {
    invoke<string | null>("get_startup_file").then((file) => {
      if (file) setPendingFile(file);
    });
  }, []);

  // When auth view changes to 'dashboard', load initial path
  useEffect(() => {
    if (view === "dashboard") {
      if (pendingFile) handleStartupNavigation(pendingFile);
      else loadInitialPath();
    }
  }, [view, pendingFile]);

  async function handleStartupNavigation(path: string) {
    const sep = navigator.userAgent.includes("Windows") ? "\\" : "/";
    const parts = path.split(sep);
    parts.pop(); // Remove filename
    let parent = parts.join(sep);

    // Fix root paths logic
    if (!navigator.userAgent.includes("Windows") && !parent.startsWith("/"))
      parent = "/" + parent;
    if (navigator.userAgent.includes("Windows") && parent.endsWith(":"))
      parent += sep;
    if (parent === "")
      parent = navigator.userAgent.includes("Windows") ? "" : "/";

    await loadDir(parent);
    setSelectedPaths([path]);
    setStatusMsg(`Opened: ${path}`);
    setPendingFile(null); // Clear pending
  }

  async function loadInitialPath() {
    try {
      loadDir(await homeDir());
    } catch {
      loadDir("");
    }
  }

  async function loadDir(path: string) {
    try {
      // Logic for drive list vs directory list
      if (path === "") {
        const drives = await invoke<string[]>("get_drives");
        setEntries(
          drives.map((d) => ({
            name: d,
            isDirectory: true,
            path: d,
            isDrive: true,
            size: null,
            modified: null,
          }))
        );
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
          let size = null,
            modified = null;
          try {
            const m = await stat(fullPath);
            size = m.size;
            if (m.mtime) modified = new Date(m.mtime);
          } catch {}
          return {
            name: entry.name,
            isDirectory: entry.isDirectory,
            path: fullPath,
            size,
            modified,
          };
        })
      );

      mapped.sort((a, b) =>
        a.isDirectory === b.isDirectory
          ? a.name.localeCompare(b.name)
          : a.isDirectory
          ? -1
          : 1
      );
      setEntries(mapped);
      setCurrentPath(path);
      setSelectedPaths([]);
      setStatusMsg(`Loaded: ${path}`);
    } catch (e) {
      console.error(e);
      setStatusMsg(`Error: ${e}`);
    }
  }

  function goUp() {
    if (currentPath === "") return;
    const isWindows = navigator.userAgent.includes("Windows");
    const separator = isWindows ? "\\" : "/";
    if (
      currentPath === "/" ||
      (isWindows && currentPath.length <= 3 && currentPath.includes(":"))
    ) {
      loadDir(isWindows ? "" : "/");
      return;
    }
    const parts = currentPath.split(separator).filter((p) => p);
    parts.pop();
    let parent = parts.join(separator);
    if (!isWindows) parent = "/" + parent;
    if (isWindows && parent.length === 2 && parent.endsWith(":"))
      parent += separator;
    loadDir(parts.length === 0 ? (isWindows ? "" : "/") : parent);
  }

  return {
    currentPath,
    entries,
    selectedPaths,
    setSelectedPaths,
    statusMsg,
    setStatusMsg,
    loadDir,
    goUp,
  };
}
