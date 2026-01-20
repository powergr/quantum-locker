import { useState, useRef, useEffect } from "react";
import {
  Lock,
  Unlock,
  Sliders,
  Key,
  ShieldAlert,
  Check,
  Archive,
} from "lucide-react";

interface ToolbarProps {
  onLock: () => void;
  onUnlock: () => void;
  onRefresh: () => void; // Kept for compatibility

  // Encryption Settings
  keyFile: string | null;
  setKeyFile: (path: string | null) => void;
  selectKeyFile: () => void;
  isParanoid: boolean;
  setIsParanoid: (v: boolean) => void;

  compressionMode: string;
  onOpenCompression: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="toolbar" style={{ justifyContent: "space-between" }}>
      {/* LEFT GROUP: Lock/Unlock Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="tool-btn success" onClick={props.onLock}>
          <Lock size={26} color="#16a34a" strokeWidth={2.5} />
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            Lock
          </span>
        </button>

        <button className="tool-btn danger" onClick={props.onUnlock}>
          <Unlock size={26} color="#dc2626" strokeWidth={2.5} />
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            Unlock
          </span>
        </button>
      </div>

      {/* Spacer to push Advanced to the right */}
      <div style={{ flex: 1 }}></div>

      {/* RIGHT GROUP: Advanced Encryption Settings */}
      <div style={{ display: "flex", gap: 6 }}>
        <div className="dropdown-container" ref={advancedRef}>
          <button
            className={`tool-btn ${
              props.keyFile ||
              props.isParanoid ||
              props.compressionMode !== "auto"
                ? "active-settings"
                : ""
            }`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Sliders size={24} className="icon-default" strokeWidth={2} />
            <span style={{ fontSize: "0.7rem" }}>Advanced</span>

            {/* Indicator Dot if settings are changed */}
            {(props.keyFile ||
              props.isParanoid ||
              props.compressionMode !== "auto") && (
              <div className="indicator-dot"></div>
            )}
          </button>

          {showAdvanced && (
            <div className="dropdown-menu" style={{ right: 0 }}>
              {/* Keyfile Option */}
              <div
                className="dropdown-item"
                onClick={() => {
                  props.selectKeyFile();
                  setShowAdvanced(false);
                }}
              >
                <Key
                  size={16}
                  color={props.keyFile ? "var(--btn-success)" : "currentColor"}
                />
                {props.keyFile ? "Keyfile Active" : "Select Keyfile"}
              </div>

              {props.keyFile && (
                <div
                  className="dropdown-item danger"
                  onClick={() => props.setKeyFile(null)}
                  style={{ fontSize: "0.8rem", paddingLeft: "36px" }}
                >
                  Clear Keyfile
                </div>
              )}

              <div className="dropdown-divider"></div>

              {/* Compression Option */}
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowAdvanced(false);
                  props.onOpenCompression();
                }}
              >
                <Archive size={16} />
                <span>Zip Options</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.7rem",
                    color: "var(--accent)",
                  }}
                >
                  {props.compressionMode.toUpperCase()}
                </span>
              </div>

              <div className="dropdown-divider"></div>

              {/* Paranoid Mode Option */}
              <div
                className="dropdown-item"
                onClick={() => props.setIsParanoid(!props.isParanoid)}
              >
                <ShieldAlert
                  size={16}
                  color={props.isParanoid ? "var(--accent)" : "currentColor"}
                />
                <span>Paranoid Mode</span>
                {props.isParanoid && (
                  <Check
                    size={16}
                    color="var(--accent)"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
