import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface BookmarkEntry {
  id: string;
  title: string;
  url: string;
  category: string;
  created_at: number;
}

export interface BookmarksVault {
  entries: BookmarkEntry[];
}

export function useBookmarks() {
  const [entries, setEntries] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshVault();
  }, []);

  async function refreshVault() {
    try {
      setLoading(true);
      const vault = await invoke<BookmarksVault>("load_bookmarks_vault");
      // Sort: Category, then Title
      setEntries(
        vault.entries.sort(
          (a, b) =>
            a.category.localeCompare(b.category) ||
            a.title.localeCompare(b.title),
        ),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveBookmark(entry: BookmarkEntry) {
    try {
      const newEntries = [...entries];
      const index = newEntries.findIndex((e) => e.id === entry.id);

      if (index >= 0) {
        newEntries[index] = entry;
      } else {
        newEntries.unshift(entry);
      }

      await invoke("save_bookmarks_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to save: " + String(e));
    }
  }

  async function deleteBookmark(id: string) {
    try {
      const newEntries = entries.filter((e) => e.id !== id);
      await invoke("save_bookmarks_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to delete: " + String(e));
    }
  }

  return {
    entries,
    loading,
    error,
    saveBookmark,
    deleteBookmark,
    refreshVault,
  };
}
