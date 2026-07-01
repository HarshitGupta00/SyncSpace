const mongoose = require("mongoose");

// INVITE MODEL
// You might ask: "if we're using a JWT token for the invite link, why do we
// ALSO need a database record?" Good question — and an important interview
// point. The JWT token alone can't be revoked or marked as "already used"
// because JWTs are stateless by design (the server doesn't track issued
// tokens). So we keep a DB record as the source of truth for invite STATUS,
// and the JWT is just a tamper-proof way to carry the invite ID + a few
// claims in the URL without a DB lookup on every link click validation step.

const inviteSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"], // can't invite someone directly as "owner"
      default: "member",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
      // This is what makes an invite link revocable/one-time-use despite
      // JWTs being stateless: we check THIS field, not just JWT signature
      // validity, before allowing the invite to be accepted.
    },
    expiresAt: {
      type: Date,
      required: true,
      // Set to Date.now() + 48 hours at creation time. We check this
      // explicitly even though the JWT itself also encodes an `exp` claim —
      // belt and suspenders, and it lets us show "expires in 7 days" UI
      // without decoding the token.
    },
  },
  {
    timestamps: true,
  }
);

// Prevents sending duplicate PENDING invites to the same email for the same team.
// Note: this is a partial index — only applies when status is "pending" — so a
// person CAN be re-invited after their previous invite expired or was declined.
inviteSchema.index(
  { team: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("Invite", inviteSchema);