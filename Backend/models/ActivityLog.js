const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["parcel", "user", "auth", "settings", "system"],
      default: "system",
    },
    actor: { type: String, default: "System" },
    targetId: { type: String, default: "" },
    details: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
