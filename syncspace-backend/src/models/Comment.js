const mongoose = require("mongoose");

// COMMENT MODEL
// A single schema reused for comments on BOTH documents and whiteboards,
// instead of two separate Comment collections. We use a "polymorphic
// reference" pattern: `targetType` tells us which collection `target`
// points into.

const commentSchema = new mongoose.Schema(
  {
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Could point to a Document _id OR a Whiteboard _id
    },
    targetType: {
      type: String,
      enum: ["Document", "Whiteboard"],
      required: true,
      // Lets us do: mongoose.model(comment.targetType).findById(comment.target)
      // to dynamically resolve which collection to look in.
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Users @mentioned in this comment — used to trigger notifications
      },
    ],
    // For comments anchored to a specific text selection (inline comments
    // in the document editor), we store the selection range:
    anchor: {
      from: { type: Number, default: null },
      to: { type: Number, default: null },
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", commentSchema);