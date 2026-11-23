const mongoose = require("mongoose");

const TrackingEventSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: [
        "pending",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "delayed",
        "cancelled",
      ],
      required: true,
    },
    location: { type: String, required: true },
    description: { type: String, required: true },
    updatedBy: { type: String, default: "System" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SND-${year}-${suffix}`;
}

const ParcelSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateTrackingNumber,
    },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    sendername: { type: String, required: true, trim: true },
    recipientname: { type: String, required: true, trim: true },
    senderemail: { type: String, required: true, trim: true, lowercase: true },
    recipientemail: { type: String, required: true, trim: true, lowercase: true },
    senderphone: { type: String, default: "" },
    recipientphone: { type: String, default: "" },
    weight: { type: Number, required: true, min: 0.1 },
    dimensions: {
      length: { type: Number, default: 20 },
      width: { type: Number, default: 15 },
      height: { type: Number, default: 10 },
    },
    parcelType: {
      type: String,
      enum: [
        "document",
        "standard",
        "fragile",
        "perishable",
        "electronics",
        "oversized",
      ],
      default: "standard",
    },
    serviceTier: {
      type: String,
      enum: ["economy", "standard", "express", "overnight"],
      default: "standard",
    },
    insurance: {
      enabled: { type: Boolean, default: false },
      declaredValue: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
    },
    cost: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "paid",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cod", "wallet", "invoice"],
      default: "card",
    },
    date: { type: String },
    estimatedDelivery: { type: String },
    deliveredAt: { type: Date },
    currentLocation: { type: String, default: "" },
    assignedDriver: { type: String, default: "Unassigned" },
    note: { type: String, default: "" },
    feedback: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5 },
    // Numeric status preserved for BackgroundServices email worker compatibility:
    // 0 = created (pending email not sent), 1 = active/notified, 2 = delivered (email not sent), 3 = delivered & notified
    status: { type: Number, default: 0 },
    stage: {
      type: String,
      enum: [
        "pending",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "delayed",
        "cancelled",
      ],
      default: "pending",
    },
    trackingHistory: {
      type: [TrackingEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ParcelSchema.pre("save", function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = generateTrackingNumber();
  }
  if (!this.currentLocation) {
    this.currentLocation = this.from;
  }
  if (!this.date) {
    this.date = new Date().toISOString().split("T")[0];
  }
  if (!this.estimatedDelivery) {
    const daysByTier = {
      overnight: 1,
      express: 2,
      standard: 4,
      economy: 7,
    };
    const eta = new Date(this.date || Date.now());
    eta.setDate(eta.getDate() + (daysByTier[this.serviceTier] || 4));
    this.estimatedDelivery = eta.toISOString().split("T")[0];
  }
  if (!this.trackingHistory || this.trackingHistory.length === 0) {
    this.trackingHistory = [
      {
        stage: this.stage || "pending",
        location: this.from,
        description: "Shipment order created and label generated.",
        updatedBy: "SendIT Dispatch",
        timestamp: new Date(),
      },
    ];
  }
  next();
});

module.exports = mongoose.model("Parcel", ParcelSchema);
