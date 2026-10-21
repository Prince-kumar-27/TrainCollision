import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["warning", "critical", "emergency-brake"],
      required: true
    },
    trainIds: {
      type: [String],
      required: true
    },
    trackId: {
      type: String,
      required: true
    },
    distance: {
      type: Number,
      default: null
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      default: () => Date.now()
    },
    resolved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);