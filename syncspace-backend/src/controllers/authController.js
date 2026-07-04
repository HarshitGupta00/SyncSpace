// controllers/authController.js
// Handles signup, login, and getMe (fetch current user).
// Controllers are thin — they call services/utils and send responses.
// Business logic (hashing, token generation) is in utils, not here.

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Helper: shape the user object we send back in responses.
// WHY a helper: we send user data in signup, login, AND getMe —
// one place to add/remove fields instead of editing 3 controllers.
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  phone: user.phone,
  location: user.location,
  bio: user.bio,
  skills: user.skills,
  timezone: user.timezone,
  createdAt: user.createdAt,
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // req.body is already validated + normalized by Zod middleware before we get here

  // Check if email already taken
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, "Email already in use", 409);
  }

  // Hash the password before saving.
  // bcrypt.hash(password, saltRounds) — saltRounds=12 means 2^12 hashing
  // iterations. Higher = slower to crack (brute force), but also slower
  // to compute on signup. 12 is the current recommended balance.
  // WHY not MD5/SHA: those are fast hashing algorithms — fast to crack too.
  // bcrypt is intentionally slow, which is what you want for passwords.
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  return sendSuccess(
    res,
    { user: formatUser(user), token },
    "Account created successfully",
    201 // 201 Created — more semantically correct than 200 for resource creation
  );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // .select("+password") explicitly fetches password despite select:false on the schema
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // SECURITY NOTE: don't say "email not found" — that leaks which emails
    // are registered. Always give the same vague message for both wrong
    // email AND wrong password. This prevents "email enumeration" attacks.
    return sendError(res, "Invalid email or password", 401);
  }

  // bcrypt.compare hashes the plain password and compares to stored hash.
  // You CANNOT "decrypt" a bcrypt hash — you can only compare.
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, "Invalid email or password", 401);
  }

  const token = generateToken(user._id);

  return sendSuccess(res, { user: formatUser(user), token }, "Login successful");
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Protected
exports.getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by authMiddleware (protect)
  // We also fetch which teams they belong to — useful for the workspace switcher
  const teams = await TeamMember.find({ user: req.user._id })
    .populate("team", "name logo") // only fetch name and logo from Team — not the whole document
    .lean(); // .lean() returns a plain JS object instead of a Mongoose document
             // WHY lean(): faster and uses less memory when you only need to READ data,
             // not call save() or other Mongoose methods on it.

  return sendSuccess(res, {
    user: formatUser(req.user),
    teams: teams.map((tm) => ({
      ...tm.team,
      role: tm.role,
    })),
  });
});

// @desc    Update current user's profile
// @route   PATCH /api/auth/me
// @access  Protected
exports.updateMe = asyncHandler(async (req, res) => {
  // Whitelist which fields the user is allowed to update on their own profile.
  // WHY whitelist: if we did User.findByIdAndUpdate(id, req.body), a malicious
  // user could send { role: "admin" } and escalate privileges.
  const allowedFields = ["name", "avatar", "phone", "location", "bio", "skills", "timezone"];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,      // return the updated document, not the original
      runValidators: true, // run schema validators on the update (e.g. maxlength on bio)
    }
  );

  return sendSuccess(res, { user: formatUser(updated) }, "Profile updated");
});
