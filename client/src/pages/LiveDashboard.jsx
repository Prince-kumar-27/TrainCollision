import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveState } from "../hooks/useLiveState.js";
import { TRACKS, WEATHER_INFO } from "../config/tracks.js";
import "./LiveDashboard.css";

const STATUS = {
  normal:    { color: "#10b981", glow: "rgba(16,185,129,0.5)",  label: "Normal"    },
  warning:   { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  label: "Warning"   },
  critical:  { color: "#ef4444", glow: "rgba(239,68,68,0.6)",   label: "Critical"  },
  emergency: { color: "#ef4444", glow: "rgba(239,68,68,0.8)",   label: "Emergency" },
};

function RailwaySvg({ color }) {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
      <line x1="0" y1="30%" x2="100%" y2="30%" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
      <line x1="0" y1="70%" x2="100%" y2="70%" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
      {Array.from({ length: 28 }, (_, i) => (
        <line key={i} x1={`${(i / 27) * 100}%`} y1="18%" x2={`${(i / 27) * 100}%`} y2="82%" stroke={color} strokeWidth="3" strokeOpacity="0.15" />
      ))}
    </svg>
  );
}

function TrainMarker({ train, trackLength }) {
  const pct = Math.min(100, Math.max(0, (train.position / trackLength) * 100));
  const { color, glow } = STATUS[train.status] ?? STATUS.normal;
  const isCritical = train.status === "critical" || train.status === "emergency";

  return (
    <div className="tm-wrap" style={{ left: `${pct}%` }}>
      {isCritical && (
        <div className="tm-ping" style={{ background: glow }} />
      )}
      <div
        className="tm-glow"
        style={{ background: `radial-gradient(circle,${glow},transparent 70%)` }}
      />
      <div
        className="tm-body"
        style={{
          background: `linear-gradient(135deg,${color}33,${color}18)`,
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 10px ${glow},0 0 20px ${glow}55,inset 0 1px 0 ${color}44`,
        }}
      >
        🚂
      </div>
      <div
        className="tm-label"
        style={{
          color,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 6px ${glow}`,
        }}
      >
        {train.name.split(" ")[0]}
      </div>
    </div>
  );
}

function DistanceBridge({ a, b, trackLength, thresholds }) {
  const pctA = Math.min(100, Math.max(0, (a.position / trackLength) * 100));
  const pctB = Math.min(100, Math.max(0, (b.position / trackLength) * 100));
  const left  = Math.min(pctA, pctB);
  const width = Math.abs(pctA - pctB);
  const dist  = Math.abs(a.position - b.position);
  const color = dist <= thresholds.critical ? "#ef4444" : dist <= thresholds.warning ? "#f59e0b" : "#10b981";

  return (
    <div className="db-wrap" style={{ left: `${left}%`, width: `${width}%` }}>
      <div
        className="db-line"
        style={{
          background: `linear-gradient(90deg,transparent,${color}90,${color}90,transparent)`,
          boxShadow: `0 0 4px ${color}60`,
        }}
      >
        <div
          className="db-dist-label"
          style={{
            color,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        >
          {dist.toFixed(1)} km
        </div>
      </div>
    </div>
  );
}

function TrackCard({ track, trains, emergency, thresholds, onBrake, onClear }) {
  const sorted      = [...trains].sort((a, b) => a.position - b.position);
  const hasCritical = trains.some(t => t.status === "critical" || t.status === "emergency");
  const hasWarning  = trains.some(t => t.status === "warning");

  const borderColor = emergency || hasCritical
    ? "rgba(239,68,68,0.5)"
    : hasWarning
    ? "rgba(245,158,11,0.4)"
    : "rgba(255,255,255,0.07)";

  const glowColor = emergency || hasCritical
    ? "rgba(239,68,68,0.15)"
    : hasWarning
    ? "rgba(245,158,11,0.08)"
    : "transparent";

  return (
    <div
      className="tc-card"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: `0 4px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.03),inset 0 1px 0 rgba(255,255,255,0.05),0 0 40px ${glowColor}`,
      }}
    >
      {/* Header */}
      <div className="tc-header">
        <div className="tc-header__left">
          <div
            className="tc-dot"
            style={{ background: track.color, boxShadow: `0 0 8px ${track.color}` }}
          />
          <span className="tc-name">{track.name}</span>
          {(emergency || hasCritical) && (
            <span className="tc-badge tc-badge--emergency">
              {emergency ? "EMERGENCY" : "CRITICAL"}
            </span>
          )}
          {hasWarning && !hasCritical && !emergency && (
            <span className="tc-badge tc-badge--warning">WARNING</span>
          )}
        </div>
        <div className="tc-header__right">
          <span className="tc-train-count">{trains.length} / track</span>
          {emergency
            ? <button className="tc-btn-clear" onClick={onClear}>CLEAR</button>
            : <button className="tc-btn-brake" onClick={onBrake}>⚡</button>
          }
        </div>
      </div>

      {/* Track visualizer */}
      <div className="tc-track-wrap">
        <div
          className="tc-track-vis"
          style={{
            background: `linear-gradient(90deg,${track.color}08,${track.color}14,${track.color}08)`,
            border: `1px solid ${track.color}20`,
          }}
        >
          <RailwaySvg color={track.color} />

          {track.positions.map(pos => (
            <div
              key={pos}
              className="tc-station-tick"
              style={{ left: `${(pos / track.length) * 100}%` }}
            >
              <div
                className="tc-station-tick__line"
                style={{ background: track.color }}
              />
            </div>
          ))}

          {sorted.length >= 2 &&
            sorted.map((t, i) =>
              i < sorted.length - 1 ? (
                <DistanceBridge
                  key={`${t.id}-${sorted[i + 1].id}`}
                  a={t}
                  b={sorted[i + 1]}
                  trackLength={track.length}
                  thresholds={thresholds}
                />
              ) : null
            )}

          {trains.map(train => (
            <TrainMarker key={train.id} train={train} trackLength={track.length} />
          ))}
        </div>

        <div className="tc-km-ruler">
          {[0, track.length / 4, track.length / 2, (track.length * 3) / 4, track.length].map(km => (
            <span key={km} className="tc-km-label">{km}km</span>
          ))}
        </div>
      </div>

      {/* Train list */}
      <div className="tc-train-list">
        {trains.length === 0 ? (
          <p className="tc-train-list__empty">— NO ACTIVE TRAINS —</p>
        ) : (
          <div className="tc-train-rows">
            {trains.map(train => {
              const { color, glow, label } = STATUS[train.status] ?? STATUS.normal;
              return (
                <div
                  key={train.id}
                  className="tc-train-row"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                    boxShadow: `0 0 12px ${glow}25`,
                  }}
                >
                  <div
                    className="tc-train-row__dot"
                    style={{ background: color, boxShadow: `0 0 6px ${glow}` }}
                  />
                  <span className="tc-train-row__name">{train.name}</span>
                  <span className="tc-train-row__status" style={{ color }}>{label}</span>
                  <span className="tc-train-row__pos">{train.position} km</span>
                  {train.speed > 0 && (
                    <span className="tc-train-row__speed">{Math.round(train.speed)} km/h</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveDashboard() {
  const navigate = useNavigate();
  const { connected, state, emergencyFlash, changeWeather, triggerEmergencyBrake, clearEmergency } =
    useLiveState();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const totalCritical = state.trains.filter(t => t.status === "critical" || t.status === "emergency").length;
  const totalWarning  = state.trains.filter(t => t.status === "warning").length;
  const recentAlerts  = state.alerts.slice(0, 20);
  const activeNow     = recentAlerts.filter(a => !a.resolved && Date.now() - a.timestamp < 20000);

  /* Risk bar modifier */
  const riskMod = totalCritical > 0 ? "critical" : totalWarning > 0 ? "warning" : "nominal";

  return (
    <div className={`ld-root${emergencyFlash ? " ld-root--emergency" : ""}`}>
      <div className="ld-grid-bg" />

      {/* ── Header ── */}
      <header className="ld-header">
        <button className="ld-back-btn" onClick={() => navigate("/")}>@</button>
        <span className="ld-logo">NEXUS RAIL</span>
        <span className="ld-subtitle">LIVE MONITOR</span>

        <div className="ld-header-right">
          {totalCritical > 0 && (
            <div className="ld-pill ld-pill--critical">⚠ {totalCritical} CRITICAL</div>
          )}
          {totalWarning > 0 && (
            <div className="ld-pill ld-pill--warning">⚠ {totalWarning} WARNING</div>
          )}
          <div className="ld-pill ld-pill--count">{state.trains.length} TRAINS</div>

          <div className="ld-weather-switcher">
            {Object.entries(WEATHER_INFO).map(([mode, info]) => (
              <button
                key={mode}
                title={info.label}
                onClick={() => changeWeather(mode)}
                className={`ld-weather-btn${state.weatherMode === mode ? " ld-weather-btn--active" : ""}`}
              >
                {info.emoji}
              </button>
            ))}
          </div>

          <div className={`ld-conn ${connected ? "ld-conn--live" : "ld-conn--offline"}`}>
            <div className={`ld-conn-dot ${connected ? "ld-conn-dot--live" : "ld-conn-dot--offline"}`} />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="ld-main">

        {/* Active alerts */}
        {activeNow.length > 0 && (
          <div className="ld-alert-banner">
            <p className="ld-alert-banner__title">⚠ ACTIVE COLLISION ALERTS</p>
            {activeNow.map(a => (
              <p key={a.id} className="ld-alert-banner__msg">{a.message}</p>
            ))}
          </div>
        )}

        {/* Track cards */}
        <div className="ld-tracks-grid">
          {TRACKS.map(track => {
            const trains      = state.trains.filter(t => t.trackId === track.id);
            const isEmergency = state.emergencyTracks?.includes(track.id);
            return (
              <TrackCard
                key={track.id}
                track={track}
                trains={trains}
                emergency={isEmergency}
                thresholds={state.weatherThresholds ?? { warning: 5, critical: 2 }}
                onBrake={() => triggerEmergencyBrake(track.id)}
                onClear={() => clearEmergency(track.id)}
              />
            );
          })}
        </div>

        {/* Bottom panels */}
        <div className="ld-bottom-grid">

          {/* Event Log */}
          <div className="ld-panel">
            <div className="ld-event-log__header">
              <span className="ld-panel-label">EVENT LOG</span>
              <span className="ld-event-log__count">{recentAlerts.length} events</span>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="ld-event-log__empty">
                <span className="ld-event-log__empty-icon">🛡️</span>
                <p className="ld-event-log__empty-text">ALL CLEAR — SYSTEM NOMINAL</p>
              </div>
            ) : (
              <div className="ld-event-log__list">
                {recentAlerts.map(alert => {
                  const isCrit = alert.type === "critical" || alert.type === "emergency-brake";
                  return (
                    <div
                      key={alert.id}
                      className={`ld-event-item ${isCrit ? "ld-event-item--critical" : "ld-event-item--warning"}`}
                    >
                      <span className="ld-event-item__icon">{isCrit ? "🚨" : "⚠️"}</span>
                      <span className={`ld-event-item__msg ${isCrit ? "ld-event-item__msg--critical" : "ld-event-item__msg--warning"}`}>
                        {alert.message}
                      </span>
                      <span className="ld-event-item__time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="ld-panel ld-status-panel">
            <span className="ld-panel-label">SYSTEM STATUS</span>

            <div className="ld-stat-grid">
              {[
                { label: "Total Trains", value: state.trains.length,                                               color: "#3b82f6" },
                { label: "Alerts",       value: recentAlerts.length,                                               color: recentAlerts.length > 0 ? "#ef4444" : "#10b981" },
                { label: "Safe",         value: state.trains.filter(t => t.status === "normal").length,            color: "#10b981" },
                { label: "At Risk",      value: state.trains.filter(t => t.status !== "normal").length,            color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="ld-stat-card"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                >
                  <p className="ld-stat-card__value" style={{ color }}>{value}</p>
                  <p className="ld-stat-card__label">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="ld-weather-section__title">WEATHER · THRESHOLDS</p>
              <div className="ld-weather-section__row">
                <span className="ld-weather-section__label">
                  {WEATHER_INFO[state.weatherMode]?.emoji} {WEATHER_INFO[state.weatherMode]?.label ?? state.weatherMode}
                </span>
                <div className="ld-weather-section__thresholds">
                  <span className="ld-threshold--warning">⚠ {state.weatherThresholds?.warning}km</span>
                  <span className="ld-threshold--critical">🚨 {state.weatherThresholds?.critical}km</span>
                </div>
              </div>
              <div className="ld-risk-bar-track">
                <div className={`ld-risk-bar-fill ld-risk-bar-fill--${riskMod}`} />
              </div>
              <p className="ld-risk-label">
                {totalCritical > 0 ? "DANGER — COLLISION RISK" : totalWarning > 0 ? "CAUTION — TRAINS CLOSE" : "ALL SYSTEMS NOMINAL"}
              </p>
            </div>

            <div className="ld-tick">
              TICK #{tick} · {new Date().toLocaleTimeString()}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
