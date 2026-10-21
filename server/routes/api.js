import express from "express";
import Alert from "../models/Alert.js";
import Train from "../models/Train.js";
import { TRACKS } from "../config/tracks.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.get("/tracks", (_req, res) => res.json(TRACKS));

router.get("/alerts", async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/alerts/active", async (_req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/trains/history", async (_req, res) => {
  try {
    const trains = await Train.find().sort({ lastSeen: -1 });
    res.json(trains);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/alerts/:id/resolve", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: "Not found" });

    res.json(alert);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/alerts", async (_req, res) => {
  try {
    await Alert.deleteMany({});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ===============================
// ESP32 HARDWARE CONTROL API
// ===============================

// check if braking is required
router.get("/hardware/brake", async (_req, res) => {
  try {

    const activeAlert = await Alert.findOne({
  resolved: false,
   timestamp: { $gt: Date.now() - 30000 }// last 10 seconds
});

    if (activeAlert) {
      return res.json({
        brake: true,
        message: "Collision risk detected"
      });
    }

    res.json({
      brake: false
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// reset brake when alert resolved
router.post("/hardware/reset", async (_req, res) => {
  try {

    await Alert.updateMany(
      { resolved: false },
      { resolved: true }
    );

    res.json({
      success: true,
      message: "Brake reset"
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
