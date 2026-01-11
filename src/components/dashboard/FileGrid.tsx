import { useState, useEffect } from "react";
import { FileEntry } from "../../types";
import { formatSize, formatDate } from "../../utils/formatting";
import { Folder, File, HardDrive, CornerLeftUp } from "lucide-react";

interface FileGridProps {
  entries: FileEntry[];
  selectedPaths: string[];
  onSelect: (path: string, multi: boolean) => void;
  onNavigate: (path: string) => void;
  onGoUp: () => void;
  onContextMenu: (e: React.MouseEvent, path: string) => void;
}

// Define the shape of our column widths
interface ColWidths {
  name: number;
  type: number;
  size: number;
}

export function FileGrid({
  entries,
  selectedPaths,
  onSelect,
  onNavigate,
  onGoUp,
  onContextMenu,
}: FileGridProps) {
  // --- COLUMN RESIZING STATE (PERSISTED) ---
  const [colWidths, setColWidths] = useState<ColWidths>(() => {
    const saved = localStorage.getItem("qre-grid-layout");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore corruption */
      }
    }
    return { name: 300, type: 100, size: 100 };
  });

  // Track which column is being resized (name, type, or size)
  const [isResizing, setIsResizing] = useState<keyof ColWidths | null>(null);

  // Persist changes
  useEffect(() => {
    localStorage.setItem("qre-grid-layout", JSON.stringify(colWidths));
  }, [colWidths]);

  // Calculate grid template string
  const gridTemplate = `30px ${colWidths.name}px ${colWidths.type}px ${colWidths.size}px 1fr`;

  // --- MOUSE HANDLERS FOR RESIZE ---
  const startResize = (col: keyof ColWidths) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(col);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      setColWidths((prev) => {
        const delta = e.movementX;
        // Key is safe because isResizing is typed as keyof ColWidths
        const newWidth = prev[isResizing] + delta;
        // Min width 50px
        return { ...prev, [isResizing]: Math.max(50, newWidth) };
      });
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // --- CONTEXT MENU HANDLER ---
  const handleRightClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();

    // UX Fix: If right-clicking a file NOT in selection, select ONLY that file.
    if (!selectedPaths.includes(path)) {
      onSelect(path, false);
    }

    onContextMenu(e, path);
  };

  return (
    <div className="file-view">
      {/* HEADER */}
      <div
        className="file-header grid-row-layout"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div></div> {/* Icon Col */}
        <div className="header-cell">
          Name
          <div
            className="resize-handle"
            onMouseDown={startResize("name")}
          ></div>
        </div>
        <div className="header-cell">
          Type
          <div
            className="resize-handle"
            onMouseDown={startResize("type")}
          ></div>
        </div>
        <div className="header-cell">
          Size
          <div
            className="resize-handle"
            onMouseDown={startResize("size")}
          ></div>
        </div>
        <div className="header-cell">Modified</div>
      </div>

      {/* GO UP ROW */}
      <div
        className="file-row grid-row-layout"
        onClick={onGoUp}
        style={{ color: "var(--text-dim)", gridTemplateColumns: gridTemplate }}
      >
        <div className="icon">
          <CornerLeftUp size={16} />
        </div>
        <div className="name">...</div>
        <div className="details">Parent</div>
        <div className="details"></div>
        <div className="details"></div>
      </div>

      {/* ITEMS */}
      {entries.map((e, i) => (
        <div
          key={i}
          className={`file-row grid-row-layout ${
            selectedPaths.includes(e.path) ? "selected" : ""
          }`}
          style={{ gridTemplateColumns: gridTemplate }}
          onClick={(ev) => onSelect(e.path, ev.ctrlKey)}
          onDoubleClick={() => e.isDirectory && onNavigate(e.path)}
          onContextMenu={(ev) => handleRightClick(ev, e.path)}
        >
          <div className="icon">
            {e.isDrive ? (
              <HardDrive size={16} stroke="#7aa2f7" />
            ) : e.isDirectory ? (
              <Folder size={16} stroke="#e0af68" />
            ) : (
              <File size={16} />
            )}
          </div>
          <div className="name" title={e.name}>
            {e.name}
          </div>
          <div className="details">
            {e.isDirectory ? "Folder" : e.name.split(".").pop()?.toUpperCase()}
          </div>
          <div className="details">{formatSize(e.size)}</div>
          <div className="details">{formatDate(e.modified)}</div>
        </div>
      ))}
    </div>
  );
}
