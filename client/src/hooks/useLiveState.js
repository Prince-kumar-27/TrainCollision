import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// In development: Vite proxies /socket.io → localhost:5000 automatically.
// In production:  set VITE_SERVER_URL to your deployed backend URL.
 const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

const INITIAL_STATE = {
  trains: [], alerts: [], tracks: [],
  weatherMode: "clear",
  weatherThresholds: { warning: 5, critical: 2 },
  emergencyTracks: [],
};

export function useLiveState() {
  const socketRef = useRef(null);
  const [connected,     setConnected]     = useState(false);
  const [state,         setState]         = useState(INITIAL_STATE);
  const [personalAlert, setPersonalAlert] = useState(null);
  const [emergencyFlash,setEmergencyFlash]= useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect",          () => setConnected(true));
    socket.on("disconnect",       () => setConnected(false));
    socket.on("state:full",       (data) => setState(data));
    socket.on("alert:personal",   (a)    => { setPersonalAlert(a); setTimeout(() => setPersonalAlert(null), 15000); });
    socket.on("emergency:brake",  ()     => { setEmergencyFlash(true); setTimeout(() => setEmergencyFlash(false), 5000); });
    return () => socket.disconnect();
  }, []);

  const joinAsTrain          = useCallback((trainId, trainName)                 => socketRef.current?.emit("train:join",     { trainId, trainName }), []);
  const submitQRScan         = useCallback((trainId, trainName, trackId, pos)   => socketRef.current?.emit("train:scan",     { trainId, trainName, trackId, position: pos }), []);
  const triggerEmergencyBrake= useCallback((trackId)                            => socketRef.current?.emit("emergency:brake", { trackId }), []);
  const clearEmergency       = useCallback((trackId)                            => socketRef.current?.emit("emergency:clear", { trackId }), []);
  const changeWeather        = useCallback((mode)                               => socketRef.current?.emit("weather:change",  { mode }), []);
  const getMyTrain           = useCallback((trainId) => state.trains.find(t => t.id === trainId) ?? null, [state.trains]);

  return { connected, state, personalAlert, emergencyFlash, joinAsTrain, submitQRScan, triggerEmergencyBrake, clearEmergency, changeWeather, getMyTrain };
}
