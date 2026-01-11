import { useState } from "react";
import { Shield, Copy, Check, Eye, EyeOff } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ViewState } from "../../types";
import { getPasswordScore, getStrengthColor } from "../../utils/security";

interface AuthOverlayProps {
  view: ViewState;
  password: string;
  setPassword: (s: string) => void;
  confirmPass: string;
  setConfirmPass: (s: string) => void;
  recoveryCode: string;
  setRecoveryCode: (s: string) => void;
  onLogin: () => void;
  onInit: () => void;
  onRecovery: () => void;
  onAckRecoveryCode: () => void;
  onSwitchToRecovery: () => void;
  onCancelRecovery: () => void;
}

export function AuthOverlay(props: AuthOverlayProps) {
  const { view, password, recoveryCode } = props;
  const [copied, setCopied] = useState(false);

  // NEW: State to toggle password visibility
  const [showPass, setShowPass] = useState(false);

  async function handleCopy() {
    try {
      await writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(async () => {
        await writeText("");
      }, 30000);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  }

  let title = "Unlock Vault";
  if (view === "setup") title = "Setup QRE";
  if (view === "recovery_entry") title = "Recovery";
  if (view === "recovery_display") title = "Recovery Code";

  const score =
    view === "setup" || view === "recovery_entry"
      ? getPasswordScore(password)
      : -1;

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="modal-header">
          <Shield size={20} color="var(--accent)" />
          <h2>{title}</h2>
        </div>

        <div className="modal-body">
          {view === "recovery_display" ? (
            <>
              <p style={{ color: "var(--warning)", textAlign: "center" }}>
                SAVE THIS CODE SECURELY
              </p>

              <div className="recovery-box">
                <div className="recovery-code">{recoveryCode}</div>
                <button
                  className="secondary-btn"
                  onClick={handleCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                {copied && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    Clipboard will clear in 30s
                  </span>
                )}
              </div>

              <p
                style={{
                  color: "#ccc",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                It is the ONLY way to recover your data if you forget your
                password.
              </p>
              <button className="auth-btn" onClick={props.onAckRecoveryCode}>
                I have saved it
              </button>
            </>
          ) : (
            <>
              {view === "recovery_entry" && (
                <input
                  className="auth-input"
                  placeholder="Recovery Code (QRE-...)"
                  onChange={(e) => props.setRecoveryCode(e.target.value)}
                />
              )}

              {/* --- CUSTOM PASSWORD INPUT START --- */}
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  className="auth-input has-icon"
                  placeholder={
                    view === "login" ? "Master Password" : "New Password"
                  }
                  value={password}
                  onChange={(e) => props.setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (view === "login" ? props.onLogin() : null)
                  }
                />
                <button
                  className="password-toggle"
                  tabIndex={-1} // Skip tab selection
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? "Hide Password" : "Show Password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* --- CUSTOM PASSWORD INPUT END --- */}

              {(view === "setup" || view === "recovery_entry") && (
                <>
                  {score >= 0 && (
                    <div style={{ marginTop: "5px", marginBottom: "5px" }}>
                      <div
                        style={{
                          height: "4px",
                          width: "100%",
                          background: "#2f3448",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(score + 1) * 20}%`,
                            background: getStrengthColor(score),
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* --- CONFIRM PASSWORD INPUT START --- */}
                  <div className="password-wrapper">
                    <input
                      type={showPass ? "text" : "password"}
                      className="auth-input has-icon"
                      placeholder="Confirm Password"
                      onChange={(e) => props.setConfirmPass(e.target.value)}
                    />
                    {/* Optional: Add eye here too, or let the top eye control both. 
                         I usually let the top eye control both for cleaner UI. 
                         If you want separate control, uncomment below. */}
                    {/*
                     <button className="password-toggle" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                     */}
                  </div>
                  {/* --- CONFIRM PASSWORD INPUT END --- */}
                </>
              )}

              <button
                className="auth-btn"
                onClick={() => {
                  if (view === "setup") props.onInit();
                  else if (view === "recovery_entry") props.onRecovery();
                  else props.onLogin();
                }}
              >
                {view === "setup"
                  ? "Initialize"
                  : view === "recovery_entry"
                  ? "Reset & Login"
                  : "Unlock"}
              </button>

              {view === "login" && (
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#888",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={props.onSwitchToRecovery}
                  >
                    Forgot Password?
                  </span>
                </div>
              )}
              {view === "recovery_entry" && (
                <button
                  className="secondary-btn"
                  onClick={props.onCancelRecovery}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
