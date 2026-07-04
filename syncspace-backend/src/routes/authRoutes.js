// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { signupSchema, loginSchema, validate } = require("../validators/authValidator");

// Public routes
router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login",  validate(loginSchema),  authController.login);

// Protected routes (require valid JWT)
router.get("/me",    protect, authController.getMe);
router.patch("/me",  protect, authController.updateMe);

module.exports = router;
