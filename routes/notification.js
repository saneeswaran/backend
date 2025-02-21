const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Notification = require("../model/notification");
const User = require("../model/user"); // Ensure User model has playerId
const OneSignal = require("onesignal-node");
const dotenv = require("dotenv");
dotenv.config();

// Create OneSignal client
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_REST_API_KEY
);

// Send notification to all users
router.post(
  "/send-notification",
  asyncHandler(async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;

      // Fetch all user playerIds from the database
      const users = await User.find({}, "playerId");
      const playerIds = users.map((user) => user.playerId).filter(Boolean); // Remove null/undefined IDs

      if (playerIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No users have subscribed to notifications.",
        });
      }

      const notificationBody = {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        contents: { en: description },
        headings: { en: title },
        include_player_ids: playerIds, // Send to all subscribed users
        ...(imageUrl && { big_picture: imageUrl }),
      };

      console.log("Sending notification to users:", playerIds); // Debugging log

      const response = await client.createNotification(notificationBody, {
        headers: {
          Authorization: `Basic ${process.env.ONE_SIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log("OneSignal Response:", response.body);

      if (!response.body || !response.body.id) {
        return res.status(400).json({
          success: false,
          message: "Failed to send notification. No notification ID received.",
        });
      }

      const notificationId = response.body.id;
      console.log("Notification sent, ID:", notificationId);

      const notification = new Notification({
        notificationId,
        title,
        description,
        imageUrl,
      });

      await notification.save();

      res.json({
        success: true,
        message: "Notification sent successfully to all users.",
        data: { notificationId },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
