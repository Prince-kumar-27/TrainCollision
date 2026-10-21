// Edit this file to add/remove tracks or change QR code km positions.

export const TRACKS = [
  { id: "track-1", name: "North Main Line", color: "#3b82f6", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-2", name: "South Express",   color: "#f59e0b", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-3", name: "East Freight",    color: "#10b981", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
  { id: "track-4", name: "West Commuter",   color: "#a855f7", length: 30, positions: [0, 5, 10, 15, 20, 25, 30] },
];

// Collision warning distances (km) per weather mode
export const WEATHER_THRESHOLDS = {
  clear:       { warning: 5,  critical: 2  },
  rain:        { warning: 8,  critical: 4  },
  fog:         { warning: 12, critical: 6  },
  "heavy-fog": { warning: 20, critical: 10 },
};