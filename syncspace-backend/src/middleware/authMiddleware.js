// middleware/authMiddleware.js
// Protects routes — verifies the JWT and attaches the user to req.user.
// Every protected route uses this middleware before its controller runs.
//
// HOW IT WORKS:
// 1. Client sends: Authorization: Bearer <token>
// 2. We extract the token, verify its signature against JWT_SECRET
// 3. If valid, we fetch the user from DB and attach to req.user
// 4. If invalid/missing, we send 401 and stop the request

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { JWT_SECRET } = require("../config/env");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // JWT is sent as: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  // jwt.verify throws if token is invalid or expired —
  // these errors are caught by asyncHandler and handled in errorMiddleware
  // (JsonWebTokenError → 401, TokenExpiredError → 401)
  const decoded = jwt.verify(token, JWT_SECRET);

  // Fetch fresh user from DB using the id embedded in the token payload.
  // WHY not just trust the token's payload for user data:
  // If a user is deleted or their role changes, the token still has the old data.
  // Fetching from DB ensures we always have the current state.
  // .select("-password") because password has select:false but we're explicit here
  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    // Token was valid but user no longer exists in DB
    res.status(401);
    throw new Error("Not authorized — user no longer exists");
  }

  next(); // user is valid, continue to the actual route handler
});

module.exports = { protect };
