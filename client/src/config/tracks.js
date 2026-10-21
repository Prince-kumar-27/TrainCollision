// Keep in sync with server/config/tracks.js
export const TRACKS = [
  { id: "track-1", name: "North Main Line", color: "#3b82f6", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-2", name: "South Express",   color: "#f59e0b", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-3", name: "East Freight",    color: "#10b981", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-4", name: "West Commuter",   color: "#a855f7", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
];

export const WEATHER_INFO = {
  clear:       { label: "Clear",     emoji: "☀️"  },
  rain:        { label: "Rain",      emoji: "🌧️" },
  fog:         { label: "Fog",       emoji: "🌫️" },
  "heavy-fog": { label: "Heavy Fog", emoji: "🌁"  },
};
