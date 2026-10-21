import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./CameraScanner.css";

const QR_REGION_ID = "nexus-qr-reader";

function parseQRUrl(text) {
  try {
    const url = new URL(text.startsWith("http") ? text : "https://x.com/" + text.replace(/^\/?/, ""));
    const track = url.searchParams.get("track");
    const pos   = url.searchParams.get("pos");
    if (track && pos !== null) {
      const position = Number(pos);
      if (!isNaN(position)) return { trackId: track, position };
    }
    return null;
  } catch { return null; }
}

export default function CameraScanner({ onScan, active, onToggle }) {
  const scannerRef  = useRef(null);
  const cooldownRef = useRef(false);
  const [lastScan,  setLastScan]  = useState(null);
  const [error,     setError]     = useState(null);
  const [starting,  setStarting]  = useState(false);

  useEffect(() => {
    if (active) {
      // Small delay so React has time to paint the div into the DOM
      // with real dimensions before html5-qrcode tries to measure it.
      const t = setTimeout(startScanner, 100);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [active]);

  const startScanner = async () => {
    setError(null);
    setStarting(true);
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(
              Math.min(viewfinderWidth, viewfinderHeight) * 0.85
            );
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (text) => {
          if (cooldownRef.current) return;
          const result = parseQRUrl(text);
          if (result) {
            cooldownRef.current = true;
            setLastScan(`Track: ${result.trackId} — ${result.position} km`);
            onScan(result);
            setTimeout(() => {
              cooldownRef.current = false;
              setLastScan(null);
            }, 3000);
          }
        },
        () => {}
      );
    } catch (err) {
      const msg = err?.message ?? "";
      setError(
        msg.includes("ermission")
          ? "Camera permission denied. Allow camera access in your browser settings."
          : "Could not start camera: " + msg
      );
      onToggle();
    } finally {
      setStarting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
  };

  return (
    <div className="camera-scanner-container">
      <div className="camera-scanner-header">
        <div>
          <p className="camera-scanner-title">Live QR Scanner</p>
          <p className="camera-scanner-subtitle">
            {active
              ? "Point camera at a track QR code — auto-detects"
              : "Tap Start Camera to begin scanning"}
          </p>
        </div>
        <button
          onClick={onToggle}
          className={`camera-scanner-button ${active ? "active" : ""}`}
        >
          {starting ? "Starting…" : active ? "⏹ Stop" : "📷 Start Camera"}
        </button>
      </div>

      {error    && <div className="camera-scanner-error">{error}</div>}
      {lastScan && <div className="camera-scanner-success">✓ Scanned! {lastScan}</div>}

      {/*
        KEY FIX: Never use display:none on this div.
        html5-qrcode reads the div's width/height when it starts.
        display:none gives it 0x0 → camera stream has no size → black screen.
        Instead we use height:0 + overflow:hidden to hide it visually
        while keeping real layout dimensions when active.
      */}
      <div
        id={QR_REGION_ID}
        style={{
          minHeight: active ? 280 : 0,
          height:    active ? "auto" : 0,
          overflow:  "hidden",
        }}
      />

      {!active && !error && (
        <div className="camera-scanner-off">
          <span>📷</span>
          <p>Camera is off</p>
        </div>
      )}
    </div>
  );
}