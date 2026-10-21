import { useNavigate } from "react-router-dom";
import { useLiveState } from "../hooks/useLiveState.js";
import { TRACKS, WEATHER_INFO } from "../config/tracks.js";
import "./Home.css"; // import the new CSS

export default function Home() {
  const navigate = useNavigate();
  const { connected, state } = useLiveState();
  const activeAlerts = state.alerts.filter(a => !a.resolved && Date.now() - a.timestamp < 30000).length;

  const cards = [
    { label: "Train", sub: " Scan QR codes at each km-mark to report live position of train.", cta: "Open Scanner →", path: "/scanner", color: "#3b82f6", emoji: "🚂" },
    { label: "Monitoring Screen", sub: "Watch all  tracks with live collision warnings and alerts.", cta: "Open Dashboard →", path: "/dashboard", color: "#8b5cf6", emoji: "🖥️" },
    { label: "Track QR Codes", sub: "Generate QR codes 7 positions on each of the 4 tracks.", cta: "View Codes →", path: "/qrcodes", color: "#4a5af0", emoji: "📋" },
  ];

  const stats = [
    { label: "Active Trains", value: state.trains.length, color: "#3b82f6", icon: "🚂" },
    { label: "Active Alerts", value: activeAlerts, color: activeAlerts > 0 ? "#ef4444" : "#10b981", icon: "🛡️" },
    { label: "Tracks Online", value: `${TRACKS.length}/4`, color: "#10b981", icon: "⚡" },
    { label: "Weather", value: WEATHER_INFO[state.weatherMode]?.label ?? state.weatherMode, color: "#a855f7", icon: "📡" },
  ];

  return (
    <div className="home-container">
      <div className="home-grid-bg" />
      <div className="home-glow" />

      <header className="home-header">
        <div className="home-logo">
          <div className="home-logo-icon">🚂</div>
          <span className="home-logo-text">
            <span className="primary">NEXUS</span> <span className="accent">RAIL</span>
          </span>
        </div>
        <div className={`home-connection ${connected ? "" : "offline"}`}>
          <div className={`home-connection-dot ${connected ? "" : "offline"}`} />
          <span className={`home-connection-text ${connected ? "" : "offline"}`}>{connected ? "ONLINE" : "OFFLINE"}</span>
        </div>
      </header>

      <main className="home-hero">
        
        <h1>
          <span style={{ color: "#af42a1" }}>Smart </span>
          <span className="gradient-blue">Rail</span><br />
          <span style={{ color: "#ee0e91" }}>Safety </span>
          <span className="gradient-green">System</span>
        </h1>
       

        <div className="home-cards">
          {cards.map(c => (
            <button
              key={c.path}
              className="home-card"
              onClick={() => navigate(c.path)}
              style={{
                background: `linear-gradient(135deg,${c.color}0d,${c.color}05)`,
                border: `1px solid ${c.color}33`,
                boxShadow: `0 4px 24px rgba(5, 253, 200, 0.3),inset 0 1px 0 rgba(52, 236, 181, 0.04)`,
              }}
            >
              <div className="home-card-icon" style={{
                background: `${c.color}1a`,
                border: `1px solid ${c.color}40`,
                boxShadow: `0 0 16px ${c.color}33`
              }}>{c.emoji}</div>
              <div className="home-card-text">
                <p>{c.label}</p>
                <p>{c.sub}</p>
              </div>
              <p className="home-card-cta" style={{ color: c.color }}>{c.cta}</p>
            </button>
          ))}
        </div>

        <div className="home-stats">
          {stats.map(s => (
            <div key={s.label} className="home-stat">
              <div className="home-stat-icon">{s.icon}</div>
              <p className="home-stat-value" style={{ color: s.color }}>{s.value}</p>
              <p className="home-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}