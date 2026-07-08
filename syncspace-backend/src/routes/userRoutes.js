// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/:userId", userController.getUserProfile);

module.exports = router;
