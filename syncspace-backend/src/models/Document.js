const mongoose = require("mongoose");

// DOCUMENT MODEL
// One important design decision here: we do NOT store the rich-text content
// as a big HTML/JSON blob that we overwrite on every save. Real-time
// collaborative content is owned by Yjs (the CRDT library) — Yjs maintains
// its own binary update format. MongoDB's job here is just to persist a
// SNAPSHOT of that Yjs state periodically (debounced auto-save), not to be
// the source of truth during active editing.

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Document",
    },
    description: {
      type: String,
      default: "",
    },
    tags: [{ type: String }], // e.g. ["Roadmap", "Product", "Q2 2025"] — from the right panel in the editor screenshot

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      // Documents always belong to a project (which itself may be personal or team-owned)
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- Yjs persistence ---
    yjsState: {
      type: Buffer, // binary blob — this is Yjs's own serialized document state
      default: null,
      // We update this on a debounced interval (e.g. every few seconds of
      // inactivity) from the server-side y-websocket persistence hook, NOT
      // on every keystroke. Saving on every keystroke would hammer the DB.
    },

    // --- Custom properties (the "Properties" section in the right panel) ---
    properties: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);
