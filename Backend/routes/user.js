const express = require("express");
const router = express.Router();
const { User } = require("../db");
const { logActivity } = require("../middleware/auth");

// GET ALL USERS (with optional search/role filter)
router.get("/", async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};
    if (role && role !== "all") {
      query.role = role;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { fullname: regex },
        { email: regex },
        { country: regex },
        { phone: regex },
      ];
    }
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE USER
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE USER PROFILE / ROLE / STATUS
router.put("/:id", async (req, res) => {
  try {
    const { password, ...allowedUpdates } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await logActivity({
      action: "USER_UPDATED",
      category: "user",
      actor: req.body.actor || updatedUser.fullname,
      targetId: updatedUser._id,
      details: `Updated user profile for ${updatedUser.fullname} (${updatedUser.email}).`,
      severity: "info",
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD SAVED ADDRESS
router.post("/:id/addresses", async (req, res) => {
  try {
    const { label, recipientName, email, phone, address, city, country } =
      req.body;
    if (!label || !recipientName || !address) {
      return res
        .status(400)
        .json({ message: "Label, recipient name, and address are required." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          savedAddresses: {
            label,
            recipientName,
            email: email || "",
            phone: phone || "",
            address,
            city: city || "",
            country: country || "",
          },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE SAVED ADDRESS
router.delete("/:id/addresses/:addressId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { savedAddresses: { _id: req.params.addressId } } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }

    await logActivity({
      action: "USER_DELETED",
      category: "user",
      actor: "Admin",
      targetId: req.params.id,
      details: `Deleted user ${deleted.fullname} (${deleted.email}).`,
      severity: "warning",
    });

    res.status(200).json({ message: "The user has been deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user." });
  }
});

module.exports = router;
