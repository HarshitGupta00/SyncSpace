const mongoose = require("mongoose");

// TEAM MODEL
// Represents a workspace like "Acme Inc." from the reference screenshots.
// Notice this also does NOT contain a `members: [...]` array, for the same
// reason as User — membership + role lives in TeamMember.js.
//
// What WOULD belong here directly (not in TeamMember) is data that describes
// the team itself, not a person's relationship to it.

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      type: String, // URL, or we can just compute initials on the frontend (like "AC" for Acme Inc.)
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // We store the original creator separately from "Owner role in TeamMember"
      // as a safety net — e.g. for "only the true owner can delete the team"
      // type checks, even if ownership role is later transferred.
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Team", teamSchema);
