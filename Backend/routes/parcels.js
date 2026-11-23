const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Parcel, Settings, isLocalMode } = require("../db");
const { logActivity } = require("../middleware/auth");

const STAGE_TO_STATUS = {
  pending: 0,
  picked_up: 1,
  in_transit: 1,
  out_for_delivery: 1,
  delayed: 1,
  cancelled: 1,
  delivered: 2,
};

const STAGE_LABELS = {
  pending: "Order Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

async function getPricingConfig() {
  let settings = await Settings.findOne({ key: "global" });
  if (!settings) {
    settings = await Settings.create({ key: "global" });
  }
  return settings.pricing;
}

function calculateShippingQuote(pricing, payload) {
  const weight = Math.max(0.1, Number(payload.weight) || 1);
  const length = Number(payload.length || payload.dimensions?.length) || 20;
  const width = Number(payload.width || payload.dimensions?.width) || 15;
  const height = Number(payload.height || payload.dimensions?.height) || 10;

  // Volumetric weight (kg): L*W*H / 5000
  const volumetricWeight = (length * width * height) / 5000;
  const chargeableWeight = Math.max(weight, volumetricWeight);

  const tier = payload.serviceTier || "standard";
  const multiplier = pricing.tierMultipliers?.[tier] || 1.0;

  const baseFee = pricing.baseFee || 8;
  const weightCharge = chargeableWeight * (pricing.perKgRate || 3.5);

  let handlingSurcharge = 0;
  if (payload.parcelType === "fragile") {
    handlingSurcharge = pricing.fragileSurcharge || 6;
  } else if (payload.parcelType === "perishable") {
    handlingSurcharge = pricing.perishableSurcharge || 8;
  } else if (payload.parcelType === "oversized") {
    handlingSurcharge = 12;
  } else if (payload.parcelType === "electronics") {
    handlingSurcharge = 5;
  }

  const insuranceEnabled = Boolean(
    payload.insurance?.enabled ?? payload.insuranceEnabled
  );
  const declaredValue = Number(
    payload.insurance?.declaredValue ?? payload.declaredValue ?? 0
  );
  const insuranceFee = insuranceEnabled
    ? Math.max(
        3,
        Number(
          (
            (declaredValue * (pricing.insuranceRatePercent || 2)) /
            100
          ).toFixed(2)
        )
      )
    : 0;

  const subtotal = (baseFee + weightCharge) * multiplier;
  const total = Number((subtotal + handlingSurcharge + insuranceFee).toFixed(2));

  const transitDaysByTier = {
    overnight: 1,
    express: 2,
    standard: 4,
    economy: 7,
  };
  const transitDays = transitDaysByTier[tier] || 4;
  const etaDate = new Date();
  etaDate.setDate(etaDate.getDate() + transitDays);

  return {
    chargeableWeight: Number(chargeableWeight.toFixed(2)),
    volumetricWeight: Number(volumetricWeight.toFixed(2)),
    baseFee,
    weightCharge: Number(weightCharge.toFixed(2)),
    tierMultiplier: multiplier,
    handlingSurcharge,
    insuranceFee,
    total,
    transitDays,
    estimatedDelivery: etaDate.toISOString().split("T")[0],
  };
}

// CALCULATE SHIPPING QUOTE (Public)
router.post("/quote", async (req, res) => {
  try {
    const pricing = await getPricingConfig();
    const quote = calculateShippingQuote(pricing, req.body);
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUBLIC TRACKING BY TRACKING NUMBER OR MONGO ID
router.get("/track/:code", async (req, res) => {
  try {
    const rawCode = req.params.code.trim();
    let parcel = await Parcel.findOne({
      trackingNumber: { $regex: new RegExp(`^${rawCode}$`, "i") },
    });

    if (!parcel && (isLocalMode() || mongoose.Types.ObjectId.isValid(rawCode))) {
      parcel = await Parcel.findById(rawCode);
    }

    if (!parcel) {
      return res
        .status(404)
        .json({ message: `No parcel found with tracking code "${rawCode}".` });
    }

    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD PARCEL
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    if (
      !payload.from ||
      !payload.to ||
      !payload.sendername ||
      !payload.recipientname ||
      !payload.senderemail ||
      !payload.recipientemail
    ) {
      return res.status(400).json({
        message:
          "Origin, destination, sender and recipient names and emails are required.",
      });
    }

    if (payload.cost === undefined || payload.cost === "" || Number(payload.cost) <= 0) {
      const pricing = await getPricingConfig();
      const quote = calculateShippingQuote(pricing, payload);
      payload.cost = quote.total;
      if (!payload.estimatedDelivery) {
        payload.estimatedDelivery = quote.estimatedDelivery;
      }
      if (payload.insurance?.enabled) {
        payload.insurance.fee = quote.insuranceFee;
      }
    }

    const stage = payload.stage || "pending";
    payload.stage = stage;
    payload.status = STAGE_TO_STATUS[stage] ?? 0;

    const newParcel = new Parcel(payload);
    const parcel = await newParcel.save();

    await logActivity({
      action: "PARCEL_CREATED",
      category: "parcel",
      actor: payload.sendername || "Admin",
      targetId: parcel.trackingNumber,
      details: `Created parcel ${parcel.trackingNumber} (${parcel.from} -> ${parcel.to}, $${parcel.cost}).`,
      severity: "success",
    });

    res.status(201).json(parcel);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to create parcel." });
  }
});

// GET ALL PARCELS (with search, stage, tier filters)
router.get("/", async (req, res) => {
  try {
    const { search, stage, serviceTier, paymentStatus } = req.query;
    const query = {};

    if (stage && stage !== "all") {
      query.stage = stage;
    }
    if (serviceTier && serviceTier !== "all") {
      query.serviceTier = serviceTier;
    }
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { trackingNumber: regex },
        { from: regex },
        { to: regex },
        { sendername: regex },
        { recipientname: regex },
        { senderemail: regex },
        { recipientemail: regex },
        { assignedDriver: regex },
      ];
    }

    const parcels = await Parcel.find(query).sort({ createdAt: -1 });
    res.status(200).json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK UPDATE STAGE/STATUS
router.post("/bulk-status", async (req, res) => {
  try {
    const { ids, stage, location, description, actor } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !stage) {
      return res
        .status(400)
        .json({ message: "Parcel IDs and target stage are required." });
    }

    const numericStatus = STAGE_TO_STATUS[stage] ?? 1;
    const event = {
      stage,
      location: location || "Central Hub",
      description:
        description || `Bulk status updated to ${STAGE_LABELS[stage] || stage}.`,
      updatedBy: actor || "Admin",
      timestamp: new Date(),
    };

    const updateDoc = {
      $set: {
        stage,
        status: numericStatus,
        ...(location ? { currentLocation: location } : {}),
        ...(stage === "delivered" ? { deliveredAt: new Date() } : {}),
      },
      $push: { trackingHistory: event },
    };

    const result = await Parcel.updateMany({ _id: { $in: ids } }, updateDoc);

    await logActivity({
      action: "PARCEL_BULK_UPDATE",
      category: "parcel",
      actor: actor || "Admin",
      details: `Bulk updated ${result.modifiedCount} parcel(s) to "${stage}".`,
      severity: "info",
    });

    res.status(200).json({
      message: `Updated ${result.modifiedCount} parcel(s).`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET USER'S PARCELS (sent AND received)
router.post("/me", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const filter = req.body.filter || "all"; // 'all' | 'sent' | 'received'
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    let query;
    if (filter === "sent") {
      query = { senderemail: email };
    } else if (filter === "received") {
      query = { recipientemail: email };
    } else {
      query = { $or: [{ senderemail: email }, { recipientemail: email }] };
    }

    const parcels = await Parcel.find(query).sort({ createdAt: -1 });
    res.status(200).json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ONE PARCEL
router.get("/find/:id", async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found." });
    }
    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD TRACKING CHECKPOINT
router.post("/:id/timeline", async (req, res) => {
  try {
    const { stage, location, description, updatedBy } = req.body;
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: "Parcel not found." });

    const nextStage = stage || parcel.stage;
    const event = {
      stage: nextStage,
      location: location || parcel.currentLocation || parcel.from,
      description:
        description || `Parcel status updated to ${STAGE_LABELS[nextStage] || nextStage}.`,
      updatedBy: updatedBy || "SendIT Dispatch",
      timestamp: new Date(),
    };

    parcel.stage = nextStage;
    parcel.currentLocation = event.location;
    if (nextStage === "delivered") {
      parcel.status = 2;
      parcel.deliveredAt = new Date();
    } else if (STAGE_TO_STATUS[nextStage] !== undefined) {
      parcel.status = STAGE_TO_STATUS[nextStage];
    }
    parcel.trackingHistory.push(event);

    const updated = await parcel.save();

    await logActivity({
      action: "TRACKING_CHECKPOINT",
      category: "parcel",
      actor: event.updatedBy,
      targetId: parcel.trackingNumber,
      details: `${parcel.trackingNumber}: ${STAGE_LABELS[nextStage] || nextStage} at ${event.location}.`,
      severity: nextStage === "delivered" ? "success" : nextStage === "delayed" ? "warning" : "info",
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SUBMIT CUSTOMER FEEDBACK & RATING
router.post("/:id/feedback", async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    if (!feedback && !rating) {
      return res
        .status(400)
        .json({ message: "Please provide feedback text or a star rating." });
    }

    const update = {};
    if (feedback !== undefined) update.feedback = feedback;
    if (rating !== undefined) {
      update.rating = Math.min(5, Math.max(1, Number(rating)));
    }

    const parcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!parcel) return res.status(404).json({ message: "Parcel not found." });

    await logActivity({
      action: "FEEDBACK_SUBMITTED",
      category: "parcel",
      actor: parcel.sendername,
      targetId: parcel.trackingNumber,
      details: `Customer rated parcel ${parcel.trackingNumber} (${parcel.rating || "N/A"}/5).`,
      severity: "info",
    });

    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE PARCEL
router.put("/:id", async (req, res) => {
  try {
    const existing = await Parcel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Parcel not found." });
    }

    const updates = { ...req.body };
    const stageChanged = updates.stage && updates.stage !== existing.stage;

    // Sync numeric status & stage cleanly
    if (updates.stage && STAGE_TO_STATUS[updates.stage] !== undefined) {
      updates.status = STAGE_TO_STATUS[updates.stage];
      if (updates.stage === "delivered" && !existing.deliveredAt) {
        updates.deliveredAt = new Date();
      }
    } else if (updates.status !== undefined && !updates.stage) {
      if (Number(updates.status) >= 2) {
        updates.stage = "delivered";
        updates.deliveredAt = new Date();
      }
    }

    const updateQuery = { $set: updates };
    if (stageChanged) {
      updateQuery.$push = {
        trackingHistory: {
          stage: updates.stage,
          location: updates.currentLocation || existing.currentLocation || existing.to,
          description: `Status changed to ${STAGE_LABELS[updates.stage] || updates.stage}.`,
          updatedBy: updates.updatedBy || "Admin",
          timestamp: new Date(),
        },
      };
    }

    const parcel = await Parcel.findByIdAndUpdate(req.params.id, updateQuery, {
      new: true,
    });

    await logActivity({
      action: "PARCEL_UPDATED",
      category: "parcel",
      actor: updates.updatedBy || "Admin",
      targetId: parcel.trackingNumber,
      details: `Updated parcel ${parcel.trackingNumber} (Stage: ${parcel.stage}).`,
      severity: parcel.stage === "delivered" ? "success" : "info",
    });

    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE PARCEL
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Parcel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Parcel not found." });
    }

    await logActivity({
      action: "PARCEL_DELETED",
      category: "parcel",
      actor: "Admin",
      targetId: deleted.trackingNumber,
      details: `Deleted parcel ${deleted.trackingNumber} (${deleted.from} -> ${deleted.to}).`,
      severity: "warning",
    });

    res.status(200).json({ message: "Parcel has been deleted!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
