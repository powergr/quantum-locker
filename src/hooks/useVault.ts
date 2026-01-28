import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface VaultEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  url?: string;
  notes: string;
  color?: string;
  is_pinned?: boolean;
  created_at: number;
}

export interface PasswordVault {
  entries: VaultEntry[];
}

export function useVault() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    refreshVault();
  }, []);

  async function refreshVault() {
    try {
      setLoading(true);
      const vault = await invoke<PasswordVault>("load_password_vault");
      // Initial sort by newest
      setEntries(vault.entries.sort((a, b) => b.created_at - a.created_at));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveEntry(entry: VaultEntry) {
    try {
      // Optimistic update
      const newEntries = [...entries];
      const index = newEntries.findIndex((e) => e.id === entry.id);
      if (index >= 0) newEntries[index] = entry;
      else newEntries.unshift(entry); // Add to top

      // Save to Rust
      await invoke("save_password_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to save: " + String(e));
    }
  }

  async function deleteEntry(id: string) {
    try {
      const newEntries = entries.filter((e) => e.id !== id);
      await invoke("save_password_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to delete: " + String(e));
    }
  }

  return { entries, loading, error, saveEntry, deleteEntry, refreshVault };
}
