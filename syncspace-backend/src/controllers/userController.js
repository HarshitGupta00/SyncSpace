// controllers/userController.js
// Handles user-facing profile endpoints that don't belong under /api/auth.
// /api/auth handles authentication concerns (signup, login, session/getMe).
// /api/users handles public profile lookups — e.g. viewing another team
// member's profile in the team member list or avatar hover card.

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// @desc    Get a user's public profile
// @route   GET /api/users/:userId
// @access  Protected
// Returns only public-safe fields (no email, no sensitive data).
// Used by: team member lists, @mention user pickers, comment author profiles.
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select("name avatar bio skills location timezone createdAt")
    .lean();

  if (!user) return sendError(res, "User not found", 404);

  return sendSuccess(res, { user });
});
