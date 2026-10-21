import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { TRACKS } from "../config/tracks.js";

// ⚠️ IMPORTANT: Set VITE_APP_URL in client/.env to your public domain so QR
// codes work on physical phones. In development this is localhost:3000.
const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function QRCodes() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontWeight: 800, fontSize: 18 }}>📋 Print QR Codes</span>
        <button onClick={() => window.print()} style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 10, background: "#3b82f6", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
          🖨️ Print All
        </button>
      </header>

      <div style={{ padding: 20 }}>
        <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13 }}>
          <p style={{ fontWeight: 700, color: "#3b82f6", marginBottom: 4 }}>Base URL embedded in QR codes</p>
          <code style={{ fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>{BASE_URL}</code>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
            Set <strong>VITE_APP_URL</strong> in <code>client/.env</code> to your public HTTPS domain so phones can reach the server.
          </p>
        </div>

        {TRACKS.map(track => (
          <div key={track.id} style={{ marginBottom: 36 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: track.color, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {track.name}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {track.positions.map(pos => {
                const url = `${BASE_URL}/scan?track=${track.id}&pos=${pos}`;
                return (
                  <div key={pos} style={{ background: "#fff", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", minWidth: 150 }}>
                    <QRCodeSVG value={url} size={120} level="H" />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: track.color }}>{pos} km</p>
                      <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{track.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
