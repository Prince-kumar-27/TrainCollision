import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveState } from "../hooks/useLiveState.js";
import { TRACKS } from "../config/tracks.js";
import CameraScanner from "../components/CameraScanner.jsx";

const STORAGE_ID   = "nexus_train_id";
const STORAGE_NAME = "nexus_train_name";

function genId() { return "train-" + Math.random().toString(36).slice(2, 9); }

export default function Scanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrTrack = searchParams.get("track") ?? "";
  const qrPos   = searchParams.get("pos") !== null ? Number(searchParams.get("pos")) : null;

  const { connected, state, personalAlert, emergencyFlash, joinAsTrain, submitQRScan, triggerEmergencyBrake, getMyTrain } = useLiveState();

  const [trainId,      setTrainId]      = useState(() => localStorage.getItem(STORAGE_ID)   ?? "");
  const [trainName,    setTrainName]    = useState(() => localStorage.getItem(STORAGE_NAME) ?? "");
  const [nameInput,    setNameInput]    = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (trainId && trainName) { setIsRegistered(true); joinAsTrain(trainId, trainName); }
  }, []);

  useEffect(() => {
    if (isRegistered && qrTrack && qrPos !== null && !processedRef.current) {
      processedRef.current = true;
      handleScan(qrTrack, qrPos);
    }
  }, [isRegistered]);

  const handleRegister = () => {
    if (!nameInput.trim()) return;
    const id = genId(), name = nameInput.trim();
    localStorage.setItem(STORAGE_ID, id); localStorage.setItem(STORAGE_NAME, name);
    setTrainId(id); setTrainName(name); setIsRegistered(true); joinAsTrain(id, name);
    if (qrTrack && qrPos !== null && !processedRef.current) {
      processedRef.current = true;
      setTimeout(() => handleScan(qrTrack, qrPos, id, name), 300);
    }
  };

  const handleScan = (trackId, position, id, name) => {
    submitQRScan(id ?? trainId, name ?? trainName, trackId, position);
    const trackName = TRACKS.find(t => t.id === trackId)?.name ?? trackId;
    setScanFeedback(`${trackName} — ${position} km`);
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const myTrain = isRegistered ? getMyTrain(trainId) : null;
  const statusColors = { normal: "#10b981", warning: "#f59e0b", critical: "#ef4444", emergency: "#ef4444" };
  const statusColor  = statusColors[myTrain?.status ?? "normal"];

  // ── Registration ──────────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 20 }}>←</button>
          <span style={{ fontWeight: 700 }}>Train Registration</span>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: connected ? "#10b981" : "#ef4444" }}>● {connected ? "LIVE" : "OFFLINE"}</span>
        </header>
        {qrTrack && qrPos !== null && (
          <div style={{ margin: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", fontSize: 13 }}>
            <p style={{ fontWeight: 700, color: "#3b82f6" }}>QR Code Detected</p>
            <p style={{ color: "#64748b", marginTop: 4 }}>{TRACKS.find(t => t.id === qrTrack)?.name ?? qrTrack} — {qrPos} km</p>
            <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Set your train name and this scan will be submitted automatically.</p>
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 20 }}>
          <div style={{ fontSize: 64 }}>🚂</div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>Set Your Train Name</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>This name appears on all monitoring screens.</p>
          </div>
          <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} placeholder='e.g. "Express Alpha"' autoFocus
            style={{ width: "100%", maxWidth: 320, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: 18, fontWeight: 700, textAlign: "center", outline: "none" }} />
          <button onClick={handleRegister} disabled={!nameInput.trim()}
            style={{ width: "100%", maxWidth: 320, padding: 16, borderRadius: 12, background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 17, border: "none", cursor: nameInput.trim() ? "pointer" : "default", opacity: nameInput.trim() ? 1 : 0.4 }}>
            Start as Train
          </button>
        </div>
      </div>
    );
  }

  // ── Main Scanner ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: emergencyFlash ? "rgba(127,29,29,0.25)" : "#0a0a0f", color: "#e2e8f0", display: "flex", flexDirection: "column", paddingBottom: 100, transition: "background 1s" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, background: "rgba(10,10,15,0.95)", zIndex: 10, backdropFilter: "blur(12px)" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ color: statusColor }}>🚂</span>
        <span style={{ fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trainName}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: connected ? "#10b981" : "#ef4444" }}>● {connected ? "LIVE" : "OFFLINE"}</span>
      </header>

      {personalAlert && (
        <div style={{ margin: 12, padding: "14px 16px", borderRadius: 12, background: personalAlert.type === "critical" ? "rgba(127,29,29,0.4)" : "rgba(120,80,0,0.4)", border: `1px solid ${personalAlert.type === "critical" ? "#ef4444" : "#f59e0b"}`, color: personalAlert.type === "critical" ? "#fca5a5" : "#fde68a", animation: "pulse 1.5s infinite" }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>⚠️ {personalAlert.message}</p>
          {personalAlert.distance != null && <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Distance: {personalAlert.distance.toFixed(1)} km</p>}
        </div>
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
        {/* Camera scanner */}
        <CameraScanner active={cameraActive} onToggle={() => setCameraActive(v => !v)} onScan={({ trackId, position }) => handleScan(trackId, position)} />

        {scanFeedback && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: 13, fontWeight: 600 }}>
            ✓ Scanned! {scanFeedback}
          </div>
        )}

        {/* Train status */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: 2, marginBottom: 14 }}>TRAIN STATUS</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["Status",    <span style={{ color: statusColor, textTransform: "capitalize" }}>{myTrain?.status ?? "Idle"}</span>],
              ["Track",     TRACKS.find(t => t.id === myTrain?.trackId)?.name ?? "—"],
              ["Position",  myTrain?.position !== undefined ? `${myTrain.position} km` : "—"],
              ["Speed",     myTrain?.speed > 0 ? `${Math.round(myTrain.speed)} km/h` : "—"],
              ["Direction", myTrain?.direction ?? "—"],
              ["Scans",     myTrain?.scanCount ?? 0],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "#64748b" }}>{label}</p>
                <p style={{ fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Manual test */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: 2, marginBottom: 4 }}>MANUAL TEST</p>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Simulate scanning a QR code without the camera.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TRACKS.map(track => (
              <div key={track.id} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: track.color, marginBottom: 8 }}>{track.name}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {track.positions.map(pos => (
                    <button key={pos} onClick={() => handleScan(track.id, pos)}
                      style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontFamily: "monospace", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", cursor: "pointer" }}>
                      {pos}km
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, textAlign: "center", color: "#64748b" }}>
          Weather: <strong style={{ color: "#e2e8f0" }}>{state.weatherMode}</strong> — warn at {state.weatherThresholds?.warning}km · critical at {state.weatherThresholds?.critical}km
        </p>
      </main>

      {/* Emergency brake */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 12, background: "rgba(10,10,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => myTrain?.trackId && triggerEmergencyBrake(myTrain.trackId)} disabled={!myTrain?.trackId}
          style={{ width: "100%", padding: "18px", borderRadius: 16, background: "#dc2626", color: "#fff", fontWeight: 900, fontSize: 20, border: "none", cursor: myTrain?.trackId ? "pointer" : "default", opacity: myTrain?.trackId ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}>
          ⚡ EMERGENCY BRAKE
        </button>
      </div>
    </div>
  );
}
