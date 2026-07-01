const mongoose = require("mongoose");

// USER MODEL
// This is the root identity of the app. Notice it does NOT contain a
// `teams: [...]` array — that's intentional. We're keeping User <-> Team
// relationship in a SEPARATE collection (TeamMember.js) because we need to
// attach extra data to that relationship (the user's ROLE in that team).
// If we stored teams directly on User as an array of IDs, we'd have nowhere
// clean to store "this user is an Admin in Team A but a Member in Team B."

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Mongo will create a unique index on this — enforced at DB level, not just app level
      lowercase: true, // normalizes "User@Mail.com" -> "user@mail.com" before saving, avoids duplicate accounts
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // password is only required if user did NOT sign up via Google OAuth.
        // This is a common interview question: "how do you handle optional fields
        // based on another field's value?" — Mongoose lets you pass a function
        // instead of a static boolean for `required`.
        return !this.googleId;
      },
      select: false, // CRITICAL: by default, .find() queries will NOT return this field.
      // You have to explicitly do User.findById(id).select('+password') to get it.
      // This prevents accidentally leaking password hashes in API responses.
    },
    googleId: {
      type: String,
      default: null, // set if user signed up/logged in via "Continue with Google"
    },
    avatar: {
      type: String, // URL to avatar image (Cloudinary/S3 link, or Google profile pic URL)
      default: "",
    },

    // --- Fields used on the User Profile page (reference screenshot) ---
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 280 },
    skills: [{ type: String }], // e.g. ["Project Management", "UX Design"]
    timezone: { type: String, default: "UTC" },

    // Every user gets an implicit "Personal Space" for solo work.
    // We don't need a separate collection for this — a Project/Document with
    // `team: null` and `owner: this user's ID` IS their personal space.
    // This keeps the data model simple: "no team" just means "personal."
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically — used for "Member Since" on profile page
  }
);

module.exports = mongoose.model("User", userSchema);