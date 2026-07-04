// controllers/notificationController.js

const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Protected
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("triggeredBy", "name avatar")
    .sort({ createdAt: -1 })
    .limit(50) // cap at 50 — paginate later if needed
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  return sendSuccess(res, { notifications, unreadCount });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:notifId/read
// @access  Protected
exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.notifId, recipient: req.user._id },
    { read: true }
  );
  return sendSuccess(res, {}, "Marked as read");
});

// @desc    Mark ALL notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Protected
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );
  return sendSuccess(res, {}, "All notifications marked as read");
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:notifId
// @access  Protected
exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({
    _id: req.params.notifId,
    recipient: req.user._id, // ensures users can only delete their own
  });
  return sendSuccess(res, {}, "Notification deleted");
});
