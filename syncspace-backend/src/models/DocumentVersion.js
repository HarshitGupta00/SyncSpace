const mongoose = require("mongoose");

// DOCUMENTVERSION MODEL
// Powers the "Version History / Time Travel" feature (Module 3, feature #14).
// Every time a meaningful save happens (debounced auto-save interval), we
// snapshot the current Yjs binary state of the document into this collection
// as a new version entry.
//
// IMPORTANT DESIGN DECISION — why a separate collection instead of an array
// on the Document model?
//
// Option A (array on Document):
//   document.versions = [{ yjsState, createdAt, savedBy }, ...]
//   Problem: MongoDB has a 16MB document size limit. If a document has many
//   versions and each Yjs binary snapshot is a few hundred KB, you can hit
//   this limit surprisingly fast. The Document model itself would become
//   bloated and every basic document fetch would carry version history baggage.
//
// Option B (separate collection) ← we use this:
//   Each version is its own MongoDB document. No size ceiling issues.
//   Basic document fetches stay lean (no version data unless explicitly asked).
//   We can paginate, diff, or prune old versions independently.

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    yjsState: {
      type: Buffer, // Yjs binary snapshot at the time this version was saved
      required: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Who was the last active editor before this version was snapshotted.
      // Shown in the Version History drawer as "Saved by Priya Singh"
    },
    label: {
      type: String,
      default: "",
      // Optional user-defined label e.g. "Before Q2 restructure"
      // Users can name a version to pin/bookmark it — similar to Google Docs
      // "Name this version" feature.
    },
    isNamedVersion: {
      type: Boolean,
      default: false,
      // Named versions (user-created labels) are kept permanently.
      // Auto-saved versions can be pruned after N days/versions to manage
      // storage — we only prune where isNamedVersion === false.
    },
  },
  {
    timestamps: true, // createdAt = when this version was snapshotted — shown as the timestamp in Version History drawer
  }
);

// Index on document + createdAt so fetching "all versions of document X,
// newest first" is fast without a full collection scan.
documentVersionSchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentVersion", documentVersionSchema);
