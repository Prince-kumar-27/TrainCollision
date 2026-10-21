import { v4 as uuidv4 } from "uuid";
import Alert from "../models/Alert.js";
import Train from "../models/Train.js";
import { TRACKS, WEATHER_THRESHOLDS } from "../config/tracks.js";

// In-memory active state (fast real-time)
let activeTrains = new Map();
let weatherMode = "clear";
let emergencyTracks = new Set();
let recentAlerts = [];

function getTrackName(id) {
  return TRACKS.find(t => t.id === id)?.name ?? id;
}

function getFullState() {
  return {
    trains: Array.from(activeTrains.values()),
    alerts: recentAlerts.slice(0, 50),
    tracks: TRACKS,
    weatherMode,
    weatherThresholds: WEATHER_THRESHOLDS[weatherMode],
    emergencyTracks: Array.from(emergencyTracks),
  };
}

function runCollisionDetection(io) {   // ✅ io added here
  const thresholds = WEATHER_THRESHOLDS[weatherMode];
  const trains = Array.from(activeTrains.values());

  trains.forEach(t => {
    if (t.status !== "emergency") t.status = "normal";
  });

  const byTrack = {};
  trains.forEach(t => {
    if (!t.trackId) return;
    if (!byTrack[t.trackId]) byTrack[t.trackId] = [];
    byTrack[t.trackId].push(t);
  });

  for (const [trackId, group] of Object.entries(byTrack)) {
    if (group.length < 2) continue;

    group.sort((a, b) => a.position - b.position);

    for (let i = 0; i < group.length - 1; i++) {
      const a = group[i];
      const b = group[i + 1];
      const dist = Math.abs(b.position - a.position);

      if (dist <= thresholds.critical) {
        a.status = "critical";
        b.status = "critical";
        pushAlert("critical", [a.id, b.id], trackId, dist, a.name, b.name);

        // ✅ NEW LINE — push brake to ESP8266 instantly!
        io.emit("hardware:brake", {
          brake: true,
          trainIds: [a.id, b.id],
          reason: "critical collision risk"
        });

      } else if (dist <= thresholds.warning) {
        if (a.status !== "critical") a.status = "warning";
        if (b.status !== "critical") b.status = "warning";
        pushAlert("warning", [a.id, b.id], trackId, dist, a.name, b.name);
      }
    }
  }
}

function pushAlert(type, trainIds, trackId, distance, nameA, nameB) {
  const key = trainIds.slice().sort().join("|");
  const cutoff = Date.now() - 10000;

  if (recentAlerts.some(a => a.type === type && a._key === key && a.timestamp > cutoff)) {
    return;
  }

  const message =
    type === "critical"
      ? `🚨 CRITICAL: ${nameA} & ${nameB} are ${distance.toFixed(1)}km apart on ${getTrackName(trackId)}!`
      : `⚠️ WARNING: ${nameA} & ${nameB} approaching on ${getTrackName(trackId)} — ${distance.toFixed(1)}km gap`;

  const alert = {
    _key: key,
    id: uuidv4(),
    type,
    trainIds,
    trackId,
    distance,
    message,
    timestamp: Date.now(),
    resolved: false,
  };

  recentAlerts.unshift(alert);
  recentAlerts = recentAlerts.slice(0, 200);

  Alert.create({
    type,
    trainIds,
    trackId,
    distance,
    message,
    timestamp: alert.timestamp,
  }).catch(console.error);
}

function setupSocketHandlers(io) {
  io.on("connection", socket => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.emit("state:full", getFullState());

    // Train registers
    socket.on("train:join", async ({ trainId, trainName }) => {
      if (!trainId || !trainName) return;

      const existing = activeTrains.get(trainId);

      activeTrains.set(trainId, {
        id: trainId,
        name: trainName,
        trackId: existing?.trackId ?? "",
        position: existing?.position ?? 0,
        speed: existing?.speed ?? 0,
        direction: existing?.direction ?? "unknown",
        status: "normal",
        socketId: socket.id,
        lastScanTime: existing?.lastScanTime ?? 0,
        lastPosition: existing?.lastPosition ?? 0,
        connectedAt: existing?.connectedAt ?? Date.now(),
        scanCount: existing?.scanCount ?? 0,
      });

      io.emit("state:full", getFullState());

      Train.findOneAndUpdate(
        { trainId },
        { name: trainName, lastSeen: new Date() },
        { upsert: true }
      ).catch(console.error);
    });

    // QR scan event
    socket.on("train:scan", async ({ trainId, trainName, trackId, position }) => {
      if (!trainId || !trackId || position === undefined) return;

      const now = Date.now();
      const existing = activeTrains.get(trainId);

      let speed = 0;
      let direction = "unknown";

      if (existing?.lastScanTime > 0) {
        const hours = (now - existing.lastScanTime) / 3600000;
        const delta = position - existing.lastPosition;

        if (hours > 0) {
          speed = Math.abs(delta / hours);
          direction = delta >= 0 ? "forward" : "backward";
        }
      }

      const updated = {
        id: trainId,
        name: trainName,
        trackId,
        position,
        speed: existing ? existing.speed * 0.3 + speed * 0.7 : speed,
        direction,
        status: existing?.status ?? "normal",
        socketId: socket.id,
        lastScanTime: now,
        lastPosition: existing?.position ?? position,
        connectedAt: existing?.connectedAt ?? now,
        scanCount: (existing?.scanCount ?? 0) + 1,
      };

      activeTrains.set(trainId, updated);

      runCollisionDetection(io);

      const state = getFullState();
      io.emit("state:full", state);

      const myAlert = state.alerts.find(
        a =>
          a.trainIds.includes(trainId) &&
          !a.resolved &&
          Date.now() - a.timestamp < 15000
      );

      if (myAlert) socket.emit("alert:personal", myAlert);

      Train.findOneAndUpdate(
        { trainId },
        {
          name: trainName,
          trackId,
          position,
          speed: updated.speed,
          direction,
          lastSeen: new Date(),
          scanCount: updated.scanCount,
        },
        { upsert: true }
      ).catch(console.error);
    });

    // Emergency brake
    socket.on("emergency:brake", ({ trackId }) => {
      const train = Array.from(activeTrains.values()).find(
        t => t.socketId === socket.id
      );

      emergencyTracks.add(trackId);

      activeTrains.forEach(t => {
        if (t.trackId === trackId) t.status = "emergency";
      });

      const alert = {
        id: uuidv4(),
        type: "emergency-brake",
        trainIds: [train?.id ?? socket.id],
        trackId,
        distance: null,
        message: `⚠️ EMERGENCY BRAKE on ${getTrackName(trackId)} by ${
          train?.name ?? "operator"
        }`,
        timestamp: Date.now(),
        resolved: false,
      };

      recentAlerts.unshift(alert);
      recentAlerts = recentAlerts.slice(0, 200);

      io.emit("state:full", getFullState());
      io.emit("emergency:brake", { trackId, alert });

      Alert.create(alert).catch(console.error);
    });

    // Clear emergency
    socket.on("emergency:clear", ({ trackId }) => {
      emergencyTracks.delete(trackId);

      activeTrains.forEach(t => {
        if (t.trackId === trackId && t.status === "emergency") {
          t.status = "normal";
        }
      });

      io.emit("state:full", getFullState());
    });

    // Weather change
    socket.on("weather:change", ({ mode }) => {
      if (!WEATHER_THRESHOLDS[mode]) return;

      weatherMode = mode;

      runCollisionDetection(io);

      io.emit("state:full", getFullState());
    });

    // Disconnect
    socket.on("disconnect", () => {
      activeTrains.forEach((train, id) => {
        if (train.socketId === socket.id) {
          activeTrains.delete(id);
          console.log(`[Socket] Train left: ${train.name}`);
        }
      });

      runCollisionDetection(io);
      io.emit("state:full", getFullState());
    });
  });
}

export { setupSocketHandlers };
