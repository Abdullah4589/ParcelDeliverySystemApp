const express = require("express");
const cron = require("node-cron");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { SendParcelDeliveredEmail } = require("./EmailService/DeliveredParcel");
const { SendParcelPendingEmail } = require("./EmailService/PendingParcel");
const { sendWelcomeEmail } = require("./EmailService/WelcomeEmail");

dotenv.config();

const app = express();
const DB_URI = process.env.DB || "mongodb://127.0.0.1:27017/sendit";
const PORT = process.env.PORT || 8001;

let isProcessing = false;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SendIT Background Worker",
    smtpConfigured: Boolean(process.env.EMAIL && process.env.PASSWORD),
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log("BackgroundServices DB connection is successful");
  })
  .catch((e) => {
    console.error("BackgroundServices DB connection error:", e.message);
  });

const run = () => {
  // Run every 30 seconds with an overlap guard instead of every 1 second
  cron.schedule("*/30 * * * * *", async () => {
    if (isProcessing || mongoose.connection.readyState !== 1) return;
    isProcessing = true;
    try {
      await SendParcelDeliveredEmail();
      await SendParcelPendingEmail();
      await sendWelcomeEmail();
    } catch (error) {
      console.error("Cron worker cycle error:", error.message);
    } finally {
      isProcessing = false;
    }
  });
};

run();

app.listen(PORT, () => {
  console.log(`BackgroundServices running on port ${PORT}`);
});
