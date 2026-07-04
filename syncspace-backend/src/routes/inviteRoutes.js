// routes/inviteRoutes.js
const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");

// Public — anyone with the link can preview or decline
router.get("/preview",   inviteController.previewInvite);
router.post("/decline",  inviteController.declineInvite);

// Protected — must be logged in
router.post("/",         protect, inviteController.sendInvites);
router.post("/accept",   protect, inviteController.acceptInvite);
router.get("/team/:teamId", protect, inviteController.getTeamInvites);
router.delete("/:inviteId", protect, inviteController.revokeInvite);

module.exports = router;
