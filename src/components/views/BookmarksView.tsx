import { useState } from "react";
import { Plus, Trash2, Bookmark, ExternalLink, Globe } from "lucide-react";
import { useBookmarks, BookmarkEntry } from "../../hooks/useBookmarks";
import { EntryDeleteModal } from "../modals/AppModals";
import { openUrl } from "@tauri-apps/plugin-opener";

export function BookmarksView() {
  const { entries, loading, saveBookmark, deleteBookmark } = useBookmarks();
  const [editing, setEditing] = useState<Partial<BookmarkEntry> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BookmarkEntry | null>(null);

  const openLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch (e) {
      alert("Error opening link: " + e);
    }
  };

  // Helper to extract domain for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "link";
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: "var(--text-dim)" }}>
        Loading Bookmarks...
      </div>
    );

  return (
    <div className="vault-view">
      <div className="vault-header">
        <div>
          <h2 style={{ margin: 0 }}>Secure Bookmarks</h2>
          <p
            style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-dim)" }}
          >
            {entries.length} private links stored.
          </p>
        </div>
        <button
          className="header-action-btn"
          onClick={() =>
            setEditing({ title: "", url: "", category: "General" })
          }
        >
          <Plus size={20} /> Add Bookmark
        </button>
      </div>

      {entries.length === 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 50,
            color: "var(--text-dim)",
            opacity: 0.7,
          }}
        >
          <Bookmark size={48} style={{ marginBottom: 10 }} />
          <p>No bookmarks yet.</p>
        </div>
      )}

      <div className="modern-grid">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="modern-card"
            style={{ height: "auto", minHeight: 160 }}
            onClick={() => setEditing(entry)}
          >
            <div style={{ display: "flex", gap: 15 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {entry.title.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {entry.title}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-dim)",
                    marginTop: 2,
                  }}
                >
                  {getDomain(entry.url)}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "var(--highlight)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: "var(--text-dim)",
                    }}
                  >
                    {entry.category}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                className="auth-btn"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: "0.9rem",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openLink(entry.url);
                }}
              >
                <ExternalLink size={16} /> Open
              </button>
              <button
                className="icon-btn-ghost danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(entry);
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="modal-overlay">
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? "Edit Bookmark" : "Add Bookmark"}</h3>
            <div
              className="modal-body"
              style={{ display: "flex", flexDirection: "column", gap: 15 }}
            >
              <input
                className="auth-input"
                placeholder="Title (e.g. My Bank)"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                autoFocus
              />

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Globe
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    color: "var(--text-dim)",
                  }}
                />
                <input
                  className="auth-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="URL (https://...)"
                  value={editing.url}
                  onChange={(e) =>
                    setEditing({ ...editing, url: e.target.value })
                  }
                />
              </div>

              <input
                className="auth-input"
                placeholder="Category (e.g. Finance)"
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="auth-btn"
                  onClick={() => {
                    const finalId = editing.id || crypto.randomUUID();
                    let finalUrl = editing.url || "";
                    if (finalUrl && !finalUrl.startsWith("http")) {
                      finalUrl = "https://" + finalUrl;
                    }
                    saveBookmark({
                      ...editing,
                      created_at: editing.created_at || Date.now(),
                      id: finalId,
                      url: finalUrl,
                      title: editing.title || "New Link",
                      category: editing.category || "General",
                    } as BookmarkEntry);
                    setEditing(null);
                  }}
                >
                  Save
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
        <EntryDeleteModal
          title={itemToDelete.title}
          onConfirm={() => {
            deleteBookmark(itemToDelete.id);
            setItemToDelete(null);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
}
