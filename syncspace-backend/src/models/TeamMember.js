const mongoose = require("mongoose");

// TEAMMEMBER MODEL (the "join collection")
// This single collection is what makes User <-> Team a proper many-to-many
// relationship. Each document here represents ONE user's membership in
// ONE team, plus their role in that specific team.
//
// Example documents:
//   { user: "userA_id", team: "teamX_id", role: "owner"  }
//   { user: "userA_id", team: "teamY_id", role: "member" }   <- same user, different team, different role!
//   { user: "userB_id", team: "teamX_id", role: "admin"  }
//
// This is exactly how the reference screenshot shows it: Harshit can be
// "Owner" of Product Team but "Member" of Design Team — same user, two rows.

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"], // restricts value to exactly these 3 — invalid roles get rejected at the DB layer
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// COMPOUND UNIQUE INDEX — this is an important interview talking point.
// It tells MongoDB: "the combination of (user, team) must be unique."
// This prevents the same user from accidentally having two membership rows
// in the same team (e.g. from a race condition if they click "Join" twice).
// A normal unique index on just `user` or just `team` alone wouldn't work,
// because the SAME user needs to appear in MULTIPLE rows (one per team).
teamMemberSchema.index({ user: 1, team: 1 }, { unique: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);