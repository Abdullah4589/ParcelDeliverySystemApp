const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const sendMail = require("../helpers/sendMail");
const Parcel = require("../models/Parcel");

dotenv.config();

const TEMPLATE_PATH = path.join(__dirname, "../templates/pendingparcel.ejs");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const SendParcelPendingEmail = async () => {
  const parcels = await Parcel.find({ status: 0 });
  if (parcels.length === 0) return;

  for (const parcel of parcels) {
    try {
      const trackingCode = parcel.trackingNumber || String(parcel._id);
      const trackUrl = `${FRONTEND_URL}/track/${trackingCode}`;

      const senderHtml = await ejs.renderFile(TEMPLATE_PATH, {
        greetingName: parcel.sendername,
        trackingNumber: trackingCode,
        trackUrl,
        sendername: parcel.sendername,
        recipientname: parcel.recipientname,
        from: parcel.from,
        to: parcel.to,
        cost: parcel.cost,
        weight: parcel.weight,
        serviceTier: parcel.serviceTier || "standard",
        estimatedDelivery: parcel.estimatedDelivery || "TBD",
        note: parcel.note || "None",
      });

      await sendMail({
        from: process.env.EMAIL || "no-reply@sendit.io",
        to: parcel.senderemail,
        subject: `Shipment Confirmed — ${trackingCode}`,
        html: senderHtml,
      });

      const recipientHtml = await ejs.renderFile(TEMPLATE_PATH, {
        greetingName: parcel.recipientname,
        trackingNumber: trackingCode,
        trackUrl,
        sendername: parcel.sendername,
        recipientname: parcel.recipientname,
        from: parcel.from,
        to: parcel.to,
        cost: parcel.cost,
        weight: parcel.weight,
        serviceTier: parcel.serviceTier || "standard",
        estimatedDelivery: parcel.estimatedDelivery || "TBD",
        note: parcel.note || "None",
      });

      await sendMail({
        from: process.env.EMAIL || "no-reply@sendit.io",
        to: parcel.recipientemail,
        subject: `Incoming Parcel from ${parcel.sendername} — ${trackingCode}`,
        html: recipientHtml,
      });

      await Parcel.findByIdAndUpdate(parcel._id, { $set: { status: 1 } });
    } catch (error) {
      console.error(`Pending email failed for parcel ${parcel._id}:`, error.message);
    }
  }
};

module.exports = { SendParcelPendingEmail };
