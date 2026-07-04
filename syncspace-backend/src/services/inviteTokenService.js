// services/inviteTokenService.js
// Generates and verifies JWT tokens specifically for team invites.
// WHY a separate secret from the main JWT_SECRET:
// If the invite secret leaks, attackers can only forge invite tokens —
// NOT auth tokens. Separate secrets = separate blast radius.

const jwt = require("jsonwebtoken");
const { INVITE_JWT_SECRET, INVITE_JWT_EXPIRES_IN, CLIENT_URL } = require("../config/env");

// Generate a signed invite token embedding the invite's DB record ID.
// The token itself doesn't contain email/role — that's in the DB record.
// The token is just a tamper-proof way to carry the inviteId in a URL.
const generateInviteToken = (inviteId) => {
  return jwt.sign(
    { inviteId },
    INVITE_JWT_SECRET,
    { expiresIn: INVITE_JWT_EXPIRES_IN }
  );
};

// Verify and decode an invite token
const verifyInviteToken = (token) => {
  return jwt.verify(token, INVITE_JWT_SECRET);
  // throws JsonWebTokenError or TokenExpiredError if invalid —
  // these are caught by asyncHandler → errorMiddleware
};

// Build the full accept-invite URL sent in the email
const buildInviteLink = (token) => {
  return `${CLIENT_URL}/invite/accept?token=${token}`;
};

module.exports = { generateInviteToken, verifyInviteToken, buildInviteLink };
