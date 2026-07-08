// middleware/rateLimiter.js
// Rate limiting middleware extracted from app.js as planned in the original
// folder structure. Provides both a global limiter and a stricter auth limiter.
//
// WHY separate auth limiter: auth endpoints (/login, /signup) are the primary
// target for brute-force attacks. A blanket 100/15min limit for the whole API
// is too lenient for auth — 10/15min on auth specifically makes credential
// stuffing impractical while leaving normal API usage unaffected.

const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // stricter: only 10 attempts per 15 min per IP for auth
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});

module.exports = { globalLimiter, authLimiter };
