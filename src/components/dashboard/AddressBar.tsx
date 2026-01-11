import { useState, useEffect } from "react";
import { ArrowUp, ArrowRight } from "lucide-react";

interface AddressBarProps {
  currentPath: string;
  onGoUp: () => void;
  onNavigate: (path: string) => void; // Added prop
}

export function AddressBar({
  currentPath,
  onGoUp,
  onNavigate,
}: AddressBarProps) {
  // Local state to allow typing
  const [pathInput, setPathInput] = useState(currentPath);

  // Sync when the actual system path changes (e.g. clicking a folder)
  useEffect(() => {
    setPathInput(currentPath);
  }, [currentPath]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onNavigate(pathInput);
    }
  };

  return (
    <div className="address-bar">
      <button className="nav-btn" onClick={onGoUp} title="Up one level">
        <ArrowUp size={18} />
      </button>
      <div
        className="path-container"
        style={{ flex: 1, display: "flex", position: "relative" }}
      >
        <input
          className="path-input"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        {/* Optional: Small go button inside right side if user prefers clicking */}
        <button
          className="nav-btn"
          style={{
            position: "absolute",
            right: 2,
            top: 2,
            bottom: 2,
            border: "none",
          }}
          onClick={() => onNavigate(pathInput)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
