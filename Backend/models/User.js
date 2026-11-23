const mongoose = require("mongoose");

const SavedAddressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, default: "" },
    age: { type: Number },
    country: { type: String, default: "" },
    address: { type: String, default: "" },
    password: { type: String, required: true },
    // 0 = welcome email pending, 1 = welcome email sent
    status: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    savedAddresses: {
      type: [SavedAddressSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
