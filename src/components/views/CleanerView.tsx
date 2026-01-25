import { useState } from "react";
import { ScanSearch, MapPin, User, Calendar, Camera, CheckCircle, X, Upload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog"; // <--- ADDED
import { useDragDrop } from "../../hooks/useDragDrop";

interface MetaReport {
  has_gps: boolean;
  has_author: boolean;
  camera_info?: string;
  software_info?: string;
  creation_date?: string;
  file_type: string;
}

export function CleanerView() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]); 
  const [previewReport, setPreviewReport] = useState<MetaReport | null>(null);

  const { isDragging } = useDragDrop(async (newFiles) => {
    addFiles(newFiles);
  });

  // Shared logic for Drag and Click
  const addFiles = (newPaths: string[]) => {
    setFiles((prev) => [...new Set([...prev, ...newPaths])]);
    if (newPaths.length > 0 && !previewReport) {
      analyze(newPaths[0]);
    }
  };

  // NEW: Browse Handler
  async function handleBrowse() {
    try {
        const selected = await open({
            multiple: true,
            // Only allow cleanable types
            filters: [{ name: "Media & Docs", extensions: ["jpg", "jpeg", "png", "pdf", "docx", "xlsx", "pptx", "zip"] }] 
        });
        if (selected) {
            const paths = Array.isArray(selected) ? selected : [selected];
            addFiles(paths);
        }
    } catch (e) {
        console.error(e);
    }
  }

  async function analyze(path: string) {
    setLoading(true);
    try {
      const res = await invoke<MetaReport>("analyze_file_metadata", { path });
      setPreviewReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function cleanAll() {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    
    const cleaned: string[] = [];
    for (const file of files) {
        try {
            const res = await invoke<string>("clean_file_metadata", { path: file });
            cleaned.push(res);
        } catch (e) {
            console.error(`Failed to clean ${file}:`, e);
        }
    }

    setResults(cleaned);
    setLoading(false);
    setFiles([]); 
    setPreviewReport(null);
  }

  function removeFile(path: string) {
      const newFiles = files.filter(f => f !== path);
      setFiles(newFiles);
      if (newFiles.length === 0) setPreviewReport(null);
      else if (files.indexOf(path) === 0) analyze(newFiles[0]); 
  }

  return (
    <div className="shredder-view">
      <div 
        className={`shred-zone ${isDragging ? "active" : ""}`} 
        style={{ borderColor: "var(--accent)" }}
        // Clickable Zone if empty
        onClick={files.length === 0 && results.length === 0 ? handleBrowse : undefined}
      >
        
        {files.length === 0 && results.length === 0 ? (
          <>
            <ScanSearch size={64} color="var(--accent)" style={{ marginBottom: 20 }} />
            <h2>Metadata Cleaner</h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 20 }}>
              Drag files here OR click to browse.
            </p>
            <button className="secondary-btn" onClick={(e) => { e.stopPropagation(); handleBrowse(); }}>
                <Upload size={16} style={{marginRight: 8}}/> Select Photos/Docs
            </button>
          </>
        ) : null}

        {/* RESULTS SCREEN */}
        {results.length > 0 && (
            <div style={{ textAlign: "center", color: "#42b883", width: "100%" }}>
                <CheckCircle size={56} style={{ marginBottom: 15 }} />
                <h3>{results.length} Files Cleaned!</h3>
                <div style={{ textAlign: "left", background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 6, margin: "15px 0", maxHeight: 150, overflowY: "auto", fontSize: "0.85rem", color: "var(--text-dim)" }}>
                    {results.map((r, i) => <div key={i}>✓ {r.split(/[/\\]/).pop()}</div>)}
                </div>
                <button className="auth-btn" onClick={() => setResults([])} style={{ width: "100%" }}>Clean More</button>
            </div>
        )}

        {/* PROCESSING SCREEN */}
        {files.length > 0 && (
          <div style={{ width: "100%", textAlign: "left" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{fontWeight: "bold"}}>{files.length} Files Selected</span>
                <button className="secondary-btn" style={{padding: "2px 8px", fontSize: "0.75rem", marginTop:0}} onClick={() => { setFiles([]); setPreviewReport(null); }}>Clear All</button>
            </div>

            {/* File List */}
            <div style={{ maxHeight: "100px", overflowY: "auto", marginBottom: 20 }}>
                {files.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "4px 8px", background: "rgba(255,255,255,0.05)", marginBottom: 2, borderRadius: 4 }}>
                        <span style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{f.split(/[/\\]/).pop()}</span>
                        <X size={14} style={{cursor:"pointer"}} onClick={() => removeFile(f)} />
                    </div>
                ))}
            </div>

            {/* Preview of First File Metadata */}
            {previewReport && (
               <div style={{ background: "rgba(0,0,0,0.2)", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: 10 }}>METADATA SAMPLE:</div>
                  
                  {previewReport.has_gps && <div style={{ display: "flex", gap: 10, color: "#d94040", marginBottom: 5 }}><MapPin size={16} /> <strong>GPS Location Data</strong></div>}
                  {previewReport.has_author && <div style={{ display: "flex", gap: 10, color: "#eab308", marginBottom: 5 }}><User size={16} /> <strong>Author / Owner Name</strong></div>}
                  {previewReport.camera_info && <div style={{ display: "flex", gap: 10, color: "var(--text-main)", marginBottom: 5 }}><Camera size={16} /> {previewReport.camera_info}</div>}
                  {previewReport.creation_date && <div style={{ display: "flex", gap: 10, color: "var(--text-main)", marginBottom: 5 }}><Calendar size={16} /> {previewReport.creation_date}</div>}

                  {!previewReport.has_gps && !previewReport.has_author && !previewReport.camera_info && (
                      <div style={{ color: "#42b883", display: "flex", gap:10 }}><CheckCircle size={16} /> No sensitive metadata found.</div>
                  )}
               </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
                <button 
                    className="auth-btn" 
                    style={{ flex: 1 }} 
                    onClick={cleanAll}
                    disabled={loading}
                >
                    {loading ? "Cleaning..." : `Scrub ${files.length} Files`}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}