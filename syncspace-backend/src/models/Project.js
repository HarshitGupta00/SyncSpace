const mongoose = require("mongoose");

// PROJECT MODEL
// This is where the "solo vs team" decision actually gets implemented.
// Remember from Module 0: a user can work SOLO (personal space) or inside
// a TEAM. Rather than building two separate systems for these, we model
// it with ONE schema where `team` is OPTIONAL (nullable).

const projectSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "archived"],
      default: "not_started",
    },
    progress: {
      type: Number, // 0-100, shown as the progress bar in the reference screenshots
      default: 0,
      min: 0,
      max: 100,
    },
    icon: {
      type: String, // which icon/emoji to render in the colored square (e.g. "rocket", "search")
      default: "folder",
    },
    color: {
      type: String, // category color for the icon square (black/blue/green/purple etc.)
      default: "black",
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      // THIS is the key field. If `team` is null, this project belongs to
      // nobody but its owner -> it's a "Personal Space" project.
      // If `team` is set, it belongs to that team, and access is governed
      // by TeamMember roles for that team.
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Always required, regardless of solo or team mode. In solo mode,
      // `owner` is effectively the only person with access. In team mode,
      // `owner` is just "who created this project" — actual access is via
      // the team's membership, not this field.
    },

    // --- Project-level permission overrides ---
    // Per-project role overrides for specific team members.
    // Empty by default: no override = inherit from team role using this mapping:
    //   team owner/admin → editor (can edit content/metadata)
    //   team member      → editor (default — team members can edit by default)
    // An entry here OVERRIDES that default for a specific user, e.g. to
    // restrict a team member to "viewer" on a sensitive project.
    // This is the second permission layer described in the project overview
    // (Module 0: "Two-level permissions").
    memberOverrides: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "commenter", "editor"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// A simple but important query pattern this enables:
//   Personal projects for a user:  Project.find({ team: null, owner: userId })
//   Team's projects:               Project.find({ team: teamId })
// No need for a separate "PersonalSpace" collection — null `team` IS the personal space.

module.exports = mongoose.model("Project", projectSchema);
