const express = require("express");
const router = express.Router();
const CryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");
const User = require("../db").User;
const {
  getJwtSecret,
  getPassSecret,
  verifyToken,
  logActivity,
} = require("../middleware/auth");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, age, country, address, phone, role } =
      req.body;

    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const encryptedPassword = CryptoJs.AES.encrypt(
      password,
      getPassSecret()
    ).toString();

    const allowedRoles = ["user", "driver", "admin"];
    const safeRole = allowedRoles.includes(role) ? role : "user";

    const newUser = new User({
      fullname: fullname.trim(),
      email: normalizedEmail,
      phone: phone || "",
      age: age ? Number(age) : undefined,
      country: country || "",
      address: address || "",
      role: safeRole,
      password: encryptedPassword,
    });

    const savedUser = await newUser.save();
    const { password: _, ...info } = savedUser._doc;

    const accessToken = jwt.sign(
      { id: savedUser._id, role: savedUser.role, email: savedUser.email },
      getJwtSecret(),
      { expiresIn: "10d" }
    );

    await logActivity({
      action: "USER_REGISTERED",
      category: "auth",
      actor: savedUser.fullname,
      targetId: savedUser._id,
      details: `New ${savedUser.role} account registered (${savedUser.email}).`,
      severity: "success",
    });

    res.status(201).json({ ...info, accessToken });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to register user." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ message: "No account found with that email address." });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "This account has been suspended. Contact support." });
    }

    const decrypted = CryptoJs.AES.decrypt(user.password, getPassSecret());
    const originalPassword = decrypted.toString(CryptoJs.enc.Utf8);

    if (originalPassword !== password) {
      return res
        .status(401)
        .json({ message: "Incorrect email or password. Please try again." });
    }

    const { password: _, ...info } = user._doc;
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      getJwtSecret(),
      { expiresIn: "10d" }
    );

    await logActivity({
      action: "USER_LOGIN",
      category: "auth",
      actor: user.fullname,
      targetId: user._id,
      details: `${user.fullname} (${user.role}) signed in.`,
      severity: "info",
    });

    res.status(200).json({ ...info, accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message || "Login failed." });
  }
});

// GET CURRENT AUTHENTICATED USER
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHANGE PASSWORD
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Current password and a new password (min 6 chars) are required.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const originalPassword = CryptoJs.AES.decrypt(
      user.password,
      getPassSecret()
    ).toString(CryptoJs.enc.Utf8);

    if (originalPassword !== currentPassword) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = CryptoJs.AES.encrypt(
      newPassword,
      getPassSecret()
    ).toString();
    await user.save();

    await logActivity({
      action: "PASSWORD_CHANGED",
      category: "auth",
      actor: user.fullname,
      targetId: user._id,
      details: `${user.fullname} updated their account password.`,
      severity: "info",
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
