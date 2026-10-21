import mongoose from "mongoose";

const trainSchema = new mongoose.Schema(
  {
    trainId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    trackId: {
      type: String,
      default: ""
    },
    position: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    direction: {
      type: String,
      enum: ["forward", "backward", "unknown"],
      default: "unknown"
    },
    status: {
      type: String,
      enum: ["normal", "warning", "critical", "emergency"],
      default: "normal"
    },
    scanCount: {
      type: Number,
      default: 0
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Train", trainSchema);