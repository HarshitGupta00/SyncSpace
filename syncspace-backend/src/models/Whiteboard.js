const mongoose = require("mongoose");

// WHITEBOARD MODEL
// Same persistence philosophy as Document: Yjs owns the live state
// (this time a Y.Map/Y.Array of shapes instead of rich text), Mongo just
// stores periodic snapshots of that binary state.

const whiteboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Whiteboard",
    },
    description: {
      type: String,
      default: "",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    yjsState: {
      type: Buffer, // serialized Yjs state for the shapes (Y.Map of shape objects)
      default: null,
    },

    background: {
      type: String, // swatch color, matches "Background" picker in the right panel reference
      default: "#FFFFFF",
    },
    settings: {
      grid: { type: Boolean, default: true },
      snapToGrid: { type: Boolean, default: true },
      showCursor: { type: Boolean, default: true },
    },

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Whiteboard", whiteboardSchema);
