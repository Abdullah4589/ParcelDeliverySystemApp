const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const parcelRoute = require("./routes/parcels");
const analyticsRoute = require("./routes/analytics");
const { enableLocalMode, isLocalMode } = require("./db");
const { seedData } = require("./seed");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

let dbMode = "connecting";

// HEALTH CHECK
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SendIT API",
    version: "2.0.0",
    dbMode,
    dbState:
      isLocalMode() || mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ROUTES
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/parcels", parcelRoute);
app.use("/api/v1", analyticsRoute);

// GLOBAL ERROR FALLBACK
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.DB || "mongodb://127.0.0.1:27017/sendit";

async function connectDatabase() {
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 2000 });
    dbMode = "mongodb";
    console.log("DB connection is successful (external MongoDB)");
  } catch (err) {
    console.warn(
      `External MongoDB unavailable (${err.message}). Switching to built-in persistent local JSON database (Backend/data/local-db.json).`
    );
    enableLocalMode();
    dbMode = "local-json";
    await seedData();
    console.log(
      "Local database ready & seeded (Admin: admin@sendit.io / Admin@123 | User: alex@sendit.io / User@123)"
    );
  }
}

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SendIT Backend Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
  });
