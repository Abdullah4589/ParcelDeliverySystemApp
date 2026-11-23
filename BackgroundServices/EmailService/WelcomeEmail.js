const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const CryptoJs = require("crypto-js");
const sendMail = require("../helpers/sendMail");
const User = require("../models/User");

dotenv.config();

const TEMPLATE_PATH = path.join(__dirname, "../templates/welcome.ejs");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const sendWelcomeEmail = async () => {
  const users = await User.find({ status: 0 });
  if (users.length === 0) return;

  for (const user of users) {
    try {
      const secret = process.env.PASS || "sendit_default_pass_secret";
      const decrypted = CryptoJs.AES.decrypt(user.password, secret);
      const originalPassword = decrypted.toString(CryptoJs.enc.Utf8);

      const html = await ejs.renderFile(TEMPLATE_PATH, {
        fullname: user.fullname,
        email: user.email,
        password: originalPassword || "(Set during signup)",
        loginUrl: `${FRONTEND_URL}/login`,
      });

      await sendMail({
        from: process.env.EMAIL || "no-reply@sendit.io",
        to: user.email,
        subject: "Welcome to SendIT Logistics",
        html,
      });

      await User.findByIdAndUpdate(user._id, { $set: { status: 1 } });
    } catch (error) {
      console.error(`Welcome email failed for user ${user._id}:`, error.message);
    }
  }
};

module.exports = { sendWelcomeEmail };
