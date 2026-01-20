import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface AddressBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onGoUp: () => void;
}

export function AddressBar({
  currentPath,
  onNavigate,
  onGoUp,
}: AddressBarProps) {
  // Local state to allow typing
  const [inputVal, setInputVal] = useState(currentPath);

  // Sync local state when the actual path changes (e.g. navigation via click)
  useEffect(() => {
    setInputVal(currentPath);
  }, [currentPath]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onNavigate(inputVal);
    }
  };

  return (
    <div className="address-bar">
      <button className="nav-btn" onClick={onGoUp} title="Go Up Directory">
        <ArrowUp size={20} strokeWidth={2} />
      </button>

      <div className="path-container">
        <input
          className="path-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Path..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
