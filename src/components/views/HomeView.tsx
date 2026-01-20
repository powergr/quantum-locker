import { Lock, Trash2, Key, Fingerprint } from "lucide-react"; // CHANGED

interface HomeViewProps {
  setTab: (tab: string) => void;
}

export function HomeView({ setTab }: HomeViewProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto" /* Allow scrolling */,
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        /* Remove 'justifyContent: center' to prevent clipping at top */
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: 40, textAlign: "center", marginTop: "5vh" }}>
        <Fingerprint
          size={90}
          color="var(--accent)"
          strokeWidth={1}
          style={{ marginBottom: 15 }}
        />
        <h1
          style={{
            margin: "0",
            fontSize: "2.2rem",
            color: "var(--text-main)",
            fontWeight: 800,
          }}
        >
          QRE Privacy Toolkit
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: "1.1rem",
            marginTop: 10,
          }}
        >
          Select a tool to begin.
        </p>
      </div>

      {/* Grid Container */}
      <div className="home-grid">
        {/* Encrypt Card */}
        <div onClick={() => setTab("files")} className="home-card">
          <div
            className="card-icon"
            style={{ background: "rgba(66, 184, 131, 0.1)" }}
          >
            <Lock size={36} color="#42b883" />
          </div>
          <h3>Encrypt Files</h3>
          <p>Secure documents with military-grade AES-256.</p>
        </div>

        {/* Vault Card */}
        <div onClick={() => setTab("vault")} className="home-card">
          <div
            className="card-icon"
            style={{ background: "rgba(0, 122, 204, 0.1)" }}
          >
            <Key size={36} color="#007acc" />
          </div>
          <h3>Password Vault</h3>
          <p>Store your digital secrets securely offline.</p>
        </div>

        {/* Shredder Card */}
        <div onClick={() => setTab("shred")} className="home-card">
          <div
            className="card-icon"
            style={{ background: "rgba(217, 64, 64, 0.1)" }}
          >
            <Trash2 size={36} color="#d94040" />
          </div>
          <h3>Secure Shredder</h3>
          <p>Permanently destroy sensitive files.</p>
        </div>
      </div>
    </div>
  );
}
