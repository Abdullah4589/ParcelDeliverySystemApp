const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "global" },
    companyName: { type: String, default: "SendIT Logistics" },
    supportEmail: { type: String, default: "support@sendit.io" },
    supportPhone: { type: String, default: "+1 (800) 555-0199" },
    currency: { type: String, default: "USD" },
    currencySymbol: { type: String, default: "$" },
    pricing: {
      baseFee: { type: Number, default: 8 },
      perKgRate: { type: Number, default: 3.5 },
      fragileSurcharge: { type: Number, default: 6 },
      perishableSurcharge: { type: Number, default: 8 },
      insuranceRatePercent: { type: Number, default: 2 },
      tierMultipliers: {
        economy: { type: Number, default: 0.85 },
        standard: { type: Number, default: 1.0 },
        express: { type: Number, default: 1.55 },
        overnight: { type: Number, default: 2.25 },
      },
    },
    notifications: {
      emailOnCreate: { type: Boolean, default: true },
      emailOnDeliver: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", SettingsSchema);
