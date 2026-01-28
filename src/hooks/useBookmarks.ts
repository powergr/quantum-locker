import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface BookmarkEntry {
  id: string;
  title: string;
  url: string;
  category: string;
  created_at: number;
  // --- New Fields ---
  is_pinned?: boolean;
  color?: string;
}

export interface BookmarksVault {
  entries: BookmarkEntry[];
}

export function useBookmarks() {
  const [entries, setEntries] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    refreshVault();
  }, []);

  async function refreshVault() {
    try {
      setLoading(true);
      const vault = await invoke<BookmarksVault>("load_bookmarks_vault");
      // Initial sort: Pinned first, then Newest first
      setEntries(
        vault.entries.sort((a, b) => {
          const aPin = a.is_pinned || false;
          const bPin = b.is_pinned || false;
          if (aPin && !bPin) return -1;
          if (!aPin && bPin) return 1;
          return b.created_at - a.created_at;
        }),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveBookmark(bookmark: BookmarkEntry) {
    try {
      // Optimistic update
      const newEntries = [...entries];
      const index = newEntries.findIndex((e) => e.id === bookmark.id);

      if (index >= 0) {
        newEntries[index] = bookmark;
      } else {
        newEntries.unshift(bookmark); // Add to top
      }

      // Sort again to keep UI consistent immediately
      newEntries.sort((a, b) => {
        const aPin = a.is_pinned || false;
        const bPin = b.is_pinned || false;
        if (aPin && !bPin) return -1;
        if (!aPin && bPin) return 1;
        return b.created_at - a.created_at;
      });

      await invoke("save_bookmarks_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to save bookmark: " + String(e));
    }
  }

  async function deleteBookmark(id: string) {
    try {
      const newEntries = entries.filter((e) => e.id !== id);
      await invoke("save_bookmarks_vault", { vault: { entries: newEntries } });
      setEntries(newEntries);
    } catch (e) {
      setError("Failed to delete bookmark: " + String(e));
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
