import { useState } from "react";
import { Clipboard, Copy, Trash2, CreditCard, Key, Bitcoin, X, Clock } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard";
import { InfoModal } from "../modals/AppModals";
import "./ClipboardView.css";

export function ClipboardView() {
  const { 
      entries, loading, securePaste, copyToClipboard, clearAll,
      retentionHours, updateRetention // <--- NEW PROPS
  } = useClipboard();
  
  const [msg, setMsg] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getIcon = (cat: string) => {
    if (cat.includes("Card")) return <CreditCard size={20} />;
    if (cat.includes("API") || cat.includes("Password")) return <Key size={20} />;
    if (cat.includes("Crypto")) return <Bitcoin size={20} />;
    return <Clipboard size={20} />;
  };

  const getBadgeClass = (cat: string) => {
    if (cat.includes("Card")) return "badge card";
    if (cat.includes("Password")) return "badge password";
    if (cat.includes("API")) return "badge apikey";
    if (cat.includes("Crypto")) return "badge crypto";
    return "badge text";
  };

  return (
    <div className="clipboard-view">
      <div className="clipboard-header">
        <div>
           <h2 style={{ margin: 0 }}>Secure Clipboard</h2>
           <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-dim)" }}>
             Encrypt and store sensitive copies.
           </p>
        </div>
        
        <div className="clipboard-actions">
            {/* RETENTION SELECTOR */}
            <div className="retention-selector" title="Auto-delete entries older than...">
                <Clock size={16} color="var(--text-dim)" />
                <select 
                    value={retentionHours} 
                    onChange={(e) => updateRetention(Number(e.target.value))}
                    className="retention-dropdown"
                >
                    <option value={1}>1 Hour</option>
                    <option value={4}>4 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>1 Week</option>
                </select>
            </div>

            {entries.length > 0 && (
                <button 
                    className="secondary-btn clear-btn" 
                    onClick={() => setShowClearConfirm(true)}
                >
                    Clear
                </button>
            )}
            <button className="header-action-btn" onClick={securePaste}>
                <Clipboard size={18} /> Secure Paste
            </button>
        </div>
      </div>

      {entries.length === 0 && !loading && (
        <div style={{ textAlign: "center", marginTop: 50, opacity: 0.5 }}>
            <Clipboard size={64} />
            <p>Clipboard history is empty.</p>
            <p style={{ fontSize: "0.8rem" }}>Copy something sensitive, then click "Secure Paste".</p>
        </div>
      )}

      <div className="clipboard-list">
        {entries.map((entry) => (
            <div key={entry.id} className="clipboard-card">
                <div className="clip-icon">
                    {getIcon(entry.category)}
                </div>
                <div className="clip-content">
                    <div className="clip-preview">
                        {entry.category.includes("Password") ? "•••••••••••••" : entry.preview}
                    </div>
                    <div className="clip-meta">
                        <span className={getBadgeClass(entry.category)}>{entry.category}</span>
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div className="card-actions" style={{ opacity: 1 }}>
                    <button className="icon-btn-ghost" title="Copy" onClick={() => {
                        copyToClipboard(entry.content);
                        setMsg("Copied to clipboard (Plaintext)");
                    }}>
                        <Copy size={18} />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {msg && <InfoModal message={msg} onClose={() => setMsg(null)} />}

      {/* CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="modal-overlay" style={{ zIndex: 100005 }} onClick={() => setShowClearConfirm(false)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
               <Trash2 size={20} color="var(--btn-danger)" />
               <h2 style={{color: "var(--btn-danger)"}}>Clear History?</h2>
               <div style={{flex:1}}></div>
               <X size={20} style={{cursor:"pointer"}} onClick={() => setShowClearConfirm(false)} />
            </div>
            <div className="modal-body" style={{textAlign: "center"}}>
                <p style={{fontSize: "1.1rem", color: "var(--text-main)"}}>
                    Delete all <strong>{entries.length}</strong> clipboard entries?
                </p>
                <div style={{display: "flex", gap: 10, marginTop: 10}}>
                    <button className="secondary-btn" style={{flex: 1}} onClick={() => setShowClearConfirm(false)}>Cancel</button>
                    <button className="auth-btn danger-btn" style={{flex: 1}} onClick={() => { clearAll(); setShowClearConfirm(false); }}>Yes, Clear All</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}