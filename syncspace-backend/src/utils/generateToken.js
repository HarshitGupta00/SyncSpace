// utils/generateToken.js
// WHY a separate utility instead of calling jwt.sign() directly in controllers:
// JWT config (secret, expiry) is defined in ONE place. If you ever need to
// change expiry from "7d" to "30d", you change it here, not in 5 controllers.

const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // payload — keep it minimal, just the userId
    // WHY minimal payload: the token is sent on EVERY request. Putting
    // user name/email/role in it bloats every request. Fetch fresh data
    // from DB when you need it (via authMiddleware populating req.user).
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
