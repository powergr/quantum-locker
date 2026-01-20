import { useState } from "react";
import {
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Key,
  User,
  Globe,
} from "lucide-react";
import { useVault, VaultEntry } from "../../hooks/useVault";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { InfoModal } from "../modals/AppModals"; // Import custom modal

export function VaultView() {
  const { entries, loading, saveEntry, deleteEntry } = useVault();
  const [editing, setEditing] = useState<Partial<VaultEntry> | null>(null);
  const [showPass, setShowPass] = useState<string | null>(null);
  const [copyModalMsg, setCopyModalMsg] = useState<string | null>(null); // State for modal

  const handleCopy = async (text: string) => {
    await writeText(text);
    setCopyModalMsg("Password copied to clipboard securely."); // Trigger modal
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
          <Plus size={18} /> Add Entry {/* Renamed */}
        </button>
      </div>

      {entries.length === 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 50,
            color: "var(--text-dim)",
          }}
        >
          <Key size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
          <p>Your vault is empty. Add your first password.</p>
        </div>
      )}

      <div className="vault-grid">
        {entries.map((entry) => (
          <div key={entry.id} className="vault-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 15,
              }}
            >
              <div
                style={{
                  background: "rgba(0, 122, 204, 0.1)",
                  padding: 8,
                  borderRadius: "50%",
                }}
              >
                <Globe size={20} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "1rem" }}>
                  {entry.service}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                  {entry.username}
                </div>
              </div>
              <Trash2
                size={18}
                className="icon-btn danger"
                onClick={() => {
                  if (confirm("Delete this password?")) deleteEntry(entry.id);
                }}
              />
            </div>

            <div className="password-display">
              <span
                style={{ fontFamily: "monospace", flex: 1, fontSize: "1.1rem" }}
              >
                {showPass === entry.id ? entry.password : "••••••••••••"}
              </span>
              <button
                className="icon-btn"
                title="Show/Hide"
                onClick={() =>
                  setShowPass(showPass === entry.id ? null : entry.id)
                }
              >
                {showPass === entry.id ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
              <button
                className="icon-btn"
                title="Copy"
                onClick={() => handleCopy(entry.password)}
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="modal-overlay">
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? "Edit Entry" : "Add New Entry"}</h3>
            <div
              className="modal-body"
              style={{ display: "flex", flexDirection: "column", gap: 15 }}
            >
              <div className="input-group">
                <Globe size={16} color="var(--text-dim)" />
                <input
                  className="clean-input"
                  placeholder="Service Name (e.g. Google)"
                  value={editing.service}
                  onChange={(e) =>
                    setEditing({ ...editing, service: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div className="input-group">
                <User size={16} color="var(--text-dim)" />
                <input
                  className="clean-input"
                  placeholder="Username / Email"
                  value={editing.username}
                  onChange={(e) =>
                    setEditing({ ...editing, username: e.target.value })
                  }
                />
              </div>
              <div
                className="password-wrapper"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  paddingRight: 5,
                  background: "var(--highlight)",
                }}
              >
                <input
                  className="auth-input"
                  style={{ border: "none" }}
                  placeholder="Password"
                  value={editing.password}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                />
                <button
                  className="password-toggle"
                  title="Generate Random"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      password:
                        Math.random().toString(36).slice(-8) +
                        Math.random().toString(36).slice(-8),
                    })
                  }
                >
                  <Key size={18} />
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
                  Save Entry
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

      {/* SUCCESS MODAL FOR COPY */}
      {copyModalMsg && (
        <InfoModal
          message={copyModalMsg}
          onClose={() => setCopyModalMsg(null)}
        />
      )}
    </div>
  );
}
