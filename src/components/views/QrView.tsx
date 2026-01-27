import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { QrCode, Download, Wifi, Type, Bitcoin } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export function QrView() {
  const [text, setText] = useState("");
  const [svg, setSvg] = useState<string | null>(null);

  async function generate(input: string) {
    setText(input);
    if (!input) {
      setSvg(null);
      return;
    }
    try {
      const result = await invoke<string>("generate_qr_code", { text: input });
      setSvg(result);
    } catch (e) {
      console.error(e);
    }
  }

  async function saveQr() {
    if (!svg) return;
    try {
      const path = await save({
        filters: [{ name: "SVG Image", extensions: ["svg"] }],
        defaultPath: "qrcode.svg",
      });

      if (path) {
        // Convert string to bytes
        const encoder = new TextEncoder();
        await writeFile(path, encoder.encode(svg));
        alert("QR Code saved!");
      }
    } catch (e) {
      alert(e);
    }
  }

  // Pre-fill templates
  const templates = [
    {
      icon: <Wifi size={16} />,
      label: "Wi-Fi",
      val: "WIFI:S:MyNetwork;T:WPA;P:password;;",
    },
    {
      icon: <Bitcoin size={16} />,
      label: "Crypto",
      val: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    },
    { icon: <Type size={16} />, label: "Text", val: "" },
  ];

  return (
    <div
      style={{
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h2 style={{ margin: "0 0 10px 0", color: "var(--text-main)" }}>
          Secure QR Generator
        </h2>
        <p style={{ color: "var(--text-dim)" }}>
          Share secrets to mobile devices offline. Data never leaves this app.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 30,
          width: "100%",
          maxWidth: 800,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* INPUT SIDE */}
        <div
          className="modern-card"
          style={{ flex: 1, minWidth: 300, padding: 25 }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
            {templates.map((t) => (
              <button
                key={t.label}
                className="secondary-btn"
                style={{ flex: 1, fontSize: "0.8rem", padding: "8px" }}
                onClick={() => generate(t.val)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <textarea
            className="auth-input"
            style={{ height: 150, resize: "none", fontFamily: "monospace" }}
            placeholder="Type text to convert..."
            value={text}
            onChange={(e) => generate(e.target.value)}
          />
        </div>

        {/* OUTPUT SIDE */}
        <div
          className="modern-card"
          style={{
            flex: 1,
            minWidth: 300,
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          {svg ? (
            <div
              dangerouslySetInnerHTML={{ __html: svg }}
              style={{ width: 200, height: 200 }}
            />
          ) : (
            <div style={{ opacity: 0.3, textAlign: "center" }}>
              <QrCode size={64} color="#000" />
              <p style={{ color: "#000", marginTop: 10 }}>
                Enter text to generate
              </p>
            </div>
          )}

          {svg && (
            <button
              className="auth-btn"
              style={{ marginTop: 20, width: "100%" }}
              onClick={saveQr}
            >
              <Download size={18} style={{ marginRight: 8 }} /> Save SVG
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
