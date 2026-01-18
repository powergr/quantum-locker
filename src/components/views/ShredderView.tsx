import { useState } from "react";
import { Trash2, AlertTriangle, File } from "lucide-react";
import { useDragDrop } from "../../hooks/useDragDrop";
import { invoke } from "@tauri-apps/api/core";
import { BatchResult } from "../../types";

export function ShredderView() {
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const [shredding, setShredding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { isDragging } = useDragDrop((files) => setDroppedFiles(files));

  async function handleShred() {
    if (droppedFiles.length === 0) return;
    if (!confirm("Are you sure? This cannot be undone.")) return;

    setShredding(true);
    try {
      // Use 'delete_items' which does secure shredding on Desktop
      await invoke<BatchResult[]>("delete_items", { paths: droppedFiles });
      setResult("Files destroyed.");
      setDroppedFiles([]);
    } catch (e) {
      setResult("Error: " + String(e));
    } finally {
      setShredding(false);
      setTimeout(() => setResult(null), 3000);
    }
  }

  return (
    <div className="shredder-view">
      <div className={`shred-zone ${isDragging ? "active" : ""}`}>
        <Trash2
          size={64}
          color="var(--btn-danger)"
          style={{ marginBottom: 20 }}
        />
        <h2>Secure Shredder</h2>
        <p style={{ color: "var(--text-dim)" }}>
          Drag files here to permanently destroy them.
        </p>

        {droppedFiles.length > 0 && (
          <div style={{ margin: "20px 0", textAlign: "left" }}>
            {droppedFiles.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                <File size={14} /> {f.split(/[/\\]/).pop()}
              </div>
            ))}
          </div>
        )}

        {droppedFiles.length > 0 && (
          <button
            className="auth-btn danger-btn"
            onClick={handleShred}
            disabled={shredding}
            style={{ marginTop: 20, width: "100%" }}
          >
            {shredding ? "Shredding..." : "Shred Files Forever"}
          </button>
        )}

        {result && (
          <p style={{ color: "var(--accent)", marginTop: 20 }}>{result}</p>
        )}
      </div>

      <div
        style={{
          marginTop: 30,
          display: "flex",
          gap: 10,
          color: "var(--warning)",
          alignItems: "center",
        }}
      >
        <AlertTriangle size={18} />
        <span style={{ fontSize: "0.8rem" }}>
          On Android, this performs standard deletion due to hardware limits.
        </span>
      </div>
    </div>
  );
}
