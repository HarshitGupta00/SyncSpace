const mongoose = require("mongoose");

// NOTIFICATION MODEL
// Persisted notifications (so the Inbox/Notifications drawer has history,
// not just live Socket.io events that disappear if you weren't online).
// Socket.io is used to PUSH these in real time when online; this collection
// is what makes them durable and visible after a refresh / next login.

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "mention",        // @mentioned in a comment
        "invite",         // invited to a team
        "document_shared",
        "comment",        // someone commented on your document
        "team_joined",    // someone joined a document you're in
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      // Pre-formatted text, e.g. "Priya Singh mentioned you in Product Roadmap"
      // Simpler than reconstructing sentences on the frontend from raw data.
    },
    link: {
      type: String,
      default: "",
      // Where clicking the notification should navigate to
    },
    read: {
      type: Boolean,
      default: false,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Who caused this notification (for showing their avatar in the UI)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
