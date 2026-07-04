// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/",                       notificationController.getNotifications);
router.patch("/read-all",             notificationController.markAllAsRead);
router.patch("/:notifId/read",        notificationController.markAsRead);
router.delete("/:notifId",            notificationController.deleteNotification);

module.exports = router;
