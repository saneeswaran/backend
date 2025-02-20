const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Notification = require("../model/notification");
const OneSignal = require("onesignal-node");
const dotenv = require("dotenv");
dotenv.config();

// Create OneSignal client
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_REST_API_KEY
);

// Send notification
router.post(
  "/send-notification",
  asyncHandler(async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;

      const notificationBody = {
        app_id: process.env.ONE_SIGNAL_APP_ID, // Ensure this is present!
        contents: { en: description },
        headings: { en: title },
        included_segments: ["All"],
        ...(imageUrl && { big_picture: imageUrl }),
      };

      console.log("Sending notification:", notificationBody); // Debugging log

      // Send request with Authorization header
      const response = await client.createNotification(notificationBody, {
        headers: {
          Authorization: `Basic ${process.env.ONE_SIGNAL_REST_API_KEY}`, // 🔥 Add API key
          "Content-Type": "application/json",
        },
      });

      console.log("OneSignal Response:", response.body);

      if (!response.body || !response.body.id) {
        return res.status(400).json({
          success: false,
          message: "Failed to send notification. No notification ID received.",
          response: response.body,
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
        message: "Notification sent successfully",
        data: { notificationId },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Track notification status
router.get(
  "/track-notification/:id",
  asyncHandler(async (req, res) => {
    const notificationId = req.params.id;

    const response = await client.viewNotification(notificationId);
    const androidStats = response.body.platform_delivery_stats;

    const result = {
      platform: "Android",
      success_delivery: androidStats.android.successful,
      failed_delivery: androidStats.android.failed,
      errored_delivery: androidStats.android.errored,
      opened_notification: androidStats.android.converted,
    };
    console.log("Notification details:", androidStats);
    res.json({ success: true, message: "success", data: result });
  })
);

// Get all notifications
router.get(
  "/all-notification",
  asyncHandler(async (req, res) => {
    try {
      const notifications = await Notification.find({}).sort({ _id: -1 });
      res.json({
        success: true,
        message: "Notifications retrieved successfully.",
        data: notifications,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a notification
router.delete(
  "/delete-notification/:id",
  asyncHandler(async (req, res) => {
    const notificationID = req.params.id;
    try {
      const notification = await Notification.findByIdAndDelete(notificationID);
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found." });
      }
      res.json({
        success: true,
        message: "Notification deleted successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
