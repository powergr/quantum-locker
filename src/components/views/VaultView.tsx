import { useState } from "react";
import { Plus, Copy, Eye, EyeOff, Trash2, Key } from "lucide-react";
import { useVault, VaultEntry } from "../../hooks/useVault";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export function VaultView() {
  const { entries, loading, saveEntry, deleteEntry } = useVault();
  const [editing, setEditing] = useState<Partial<VaultEntry> | null>(null);
  const [showPass, setShowPass] = useState<string | null>(null); // ID of entry to show pass

  const handleCopy = (text: string) => {
    writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Vault...</div>;

  return (
    <div className="vault-view">
      <div className="vault-header">
        <h2>Password Vault</h2>
        <button
          className="auth-btn"
          onClick={() =>
            setEditing({ service: "", username: "", password: "", notes: "" })
          }
        >
          <Plus size={18} /> New Item
        </button>
      </div>

      <div className="vault-grid">
        {entries.map((entry) => (
          <div key={entry.id} className="vault-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {entry.service}
              </span>
              <Trash2
                size={16}
                style={{ cursor: "pointer", color: "var(--text-dim)" }}
                onClick={() => deleteEntry(entry.id)}
              />
            </div>

            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-dim)",
                marginBottom: 5,
              }}
            >
              {entry.username}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg-color)",
                padding: "8px",
                borderRadius: 4,
              }}
            >
              <span
                style={{ fontFamily: "monospace", flex: 1, overflow: "hidden" }}
              >
                {showPass === entry.id ? entry.password : "••••••••"}
              </span>
              <button
                className="icon-btn"
                onClick={() =>
                  setShowPass(showPass === entry.id ? null : entry.id)
                }
              >
                {showPass === entry.id ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>
              <button
                className="icon-btn"
                onClick={() => handleCopy(entry.password)}
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL (Simple Inline for now) */}
      {editing && (
        <div className="modal-overlay">
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? "Edit Item" : "New Item"}</h3>
            <div
              className="modal-body"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <input
                className="auth-input"
                placeholder="Service (e.g. Google)"
                value={editing.service}
                onChange={(e) =>
                  setEditing({ ...editing, service: e.target.value })
                }
              />
              <input
                className="auth-input"
                placeholder="Username"
                value={editing.username}
                onChange={(e) =>
                  setEditing({ ...editing, username: e.target.value })
                }
              />
              <div className="password-wrapper">
                <input
                  className="auth-input"
                  placeholder="Password"
                  value={editing.password}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                />
                <button
                  className="password-toggle"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      password: Math.random().toString(36).slice(-8),
                    })
                  }
                  title="Generate Random"
                >
                  <Key size={16} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="auth-btn"
                  onClick={() => {
                    saveEntry({
                      ...editing,
                      created_at: Date.now(),
                      id: editing.id || "",
                    } as VaultEntry);
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
    </div>
  );
}
