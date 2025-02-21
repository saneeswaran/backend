const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../model/user");

// 🚀 Register User
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    // 🔍 Check if user already exists
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists!" });
    }

    // 🔐 Hash the password before saving
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = new User({ name, password: hashedPassword });

    await user.save();
    res
      .status(201)
      .json({ success: true, message: "User registered successfully!" });
  })
);

// 🚀 Login User
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { name, password, playerId } = req.body;
    try {
      // 🔍 Find user by name
      const user = await User.findOne({ name });

      // ❌ Check if user exists and password matches
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid name or password." });
      }

      // ✅ Update playerId if provided
      if (playerId) {
        user.playerId = playerId;
        await user.save();
        console.log(`✅ Player ID updated for ${user.name}: ${playerId}`);
      }

      // 🔥 Send successful response
      res
        .status(200)
        .json({ success: true, message: "Login successful.", data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// 🚀 Get all subscribed users
router.get(
  "/subscribed-users",
  asyncHandler(async (req, res) => {
    try {
      const users = await User.find({ playerId: { $exists: true, $ne: null } });
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No users have subscribed to notifications.",
        });
      }
      res.json({
        success: true,
        message: "Subscribed users retrieved.",
        data: users,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
