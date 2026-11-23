const mongoose = require("mongoose");

const ParcelSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String },
    from: { type: String, required: true },
    to: { type: String, required: true },
    sendername: { type: String, required: true },
    recipientname: { type: String, required: true },
    senderemail: { type: String, required: true },
    recipientemail: { type: String, required: true },
    weight: { type: Number, required: true },
    serviceTier: { type: String, default: "standard" },
    cost: { type: Number, required: true },
    date: { type: String },
    estimatedDelivery: { type: String },
    note: { type: String },
    feedback: { type: String },
    stage: { type: String, default: "pending" },
    status: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parcel", ParcelSchema);
