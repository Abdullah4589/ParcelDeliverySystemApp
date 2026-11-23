const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

let cachedTransporter = null;

function getTransporter() {
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

const sendMail = async (messageOption) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      `[Email skipped - SMTP not configured] To: ${messageOption.to} | Subject: ${messageOption.subject}`
    );
    return { skipped: true };
  }

  const info = await transporter.sendMail(messageOption);
  console.log(`Email sent to ${messageOption.to}: ${info.response}`);
  return info;
};

module.exports = sendMail;
