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
  const [colWidths, setColWidths] = useState<ColWidths>(() => {
    const saved = localStorage.getItem("qre-grid-layout");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore corruption */
      }
    }
    return { name: 350, type: 100, size: 100 };
  });

  const [isResizing, setIsResizing] = useState<keyof ColWidths | null>(null);

  useEffect(() => {
    localStorage.setItem("qre-grid-layout", JSON.stringify(colWidths));
  }, [colWidths]);

  const gridTemplate = `30px ${colWidths.name}px ${colWidths.type}px ${colWidths.size}px 1fr`;

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
        const newWidth = prev[isResizing] + delta;
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

  const handleRightClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
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
        <div className="header-cell"></div>
        <div className="header-cell">
          Name{" "}
          <div
            className="resize-handle"
            onMouseDown={startResize("name")}
          ></div>
        </div>
        <div className="header-cell">
          Type{" "}
          <div
            className="resize-handle"
            onMouseDown={startResize("type")}
          ></div>
        </div>
        <div className="header-cell">
          Size{" "}
          <div
            className="resize-handle"
            onMouseDown={startResize("size")}
          ></div>
        </div>
        <div className="header-cell" style={{ borderRight: "none" }}>
          Modified
        </div>
      </div>

      {/* GO UP ROW */}
      <div
        className="file-row grid-row-layout"
        onClick={onGoUp}
        style={{ color: "var(--text-dim)", gridTemplateColumns: gridTemplate }}
      >
        <div className="grid-cell icon">
          <CornerLeftUp size={16} />
        </div>
        <div className="grid-cell name">..</div>
        <div className="grid-cell details"></div>
        <div className="grid-cell details"></div>
        <div
          className="grid-cell details"
          style={{ borderRight: "none" }}
        ></div>
      </div>

      {/* ITEMS */}
      {entries.map((e, i) => {
        // --- ICON LOGIC (WinRAR Style) ---
        let IconComp;
        if (e.isDrive) {
          // Drive: Silver/Blue
          IconComp = <HardDrive size={16} stroke="#4a5568" fill="#cbd5e0" />;
        } else if (e.isDirectory) {
          // Folder: Classic Yellow
          IconComp = <Folder size={16} stroke="#b45309" fill="#fcd34d" />;
        } else {
          // File: White paper look
          IconComp = <File size={16} stroke="#4a5568" fill="#f7fafc" />;
        }

        return (
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
            <div className="grid-cell icon">{IconComp}</div>
            <div className="grid-cell name" title={e.name}>
              {e.name}
            </div>
            <div className="grid-cell details">
              {e.isDirectory
                ? "Folder"
                : e.name.split(".").pop()?.toUpperCase()}
            </div>
            <div
              className="grid-cell details"
              style={{ textAlign: "right", paddingRight: 10 }}
            >
              {e.isDirectory ? "" : formatSize(e.size)}
            </div>
            <div className="grid-cell details" style={{ borderRight: "none" }}>
              {formatDate(e.modified)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
