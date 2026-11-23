const jwt = require("jsonwebtoken");
const { ActivityLog } = require("../db");

const getJwtSecret = () => process.env.JWT_SEC || "sendit_default_jwt_secret";
const getPassSecret = () => process.env.PASS || "sendit_default_pass_secret";

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
};

const verifyToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication token required." });
  }
  jwt.verify(token, getJwtSecret(), (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = decoded;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    jwt.verify(token, getJwtSecret(), (err, decoded) => {
      if (!err) req.user = decoded;
    });
  }
  next();
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      return next();
    }
    return res.status(403).json({ message: "Admin privileges required." });
  });
};

const logActivity = async ({
  action,
  category = "system",
  actor = "System",
  targetId = "",
  details,
  severity = "info",
}) => {
  try {
    await ActivityLog.create({
      action,
      category,
      actor,
      targetId: targetId ? String(targetId) : "",
      details,
      severity,
    });
  } catch (err) {
    console.error("ActivityLog error:", err.message);
  }
};

module.exports = {
  getJwtSecret,
  getPassSecret,
  verifyToken,
  optionalAuth,
  verifyAdmin,
  logActivity,
};
