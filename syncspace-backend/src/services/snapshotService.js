// services/snapshotService.js
// Shared persistence logic for Yjs state snapshots.
//
// BOTH the REST snapshot endpoint (documentController.saveSnapshot) AND the
// Yjs WebSocket handler (yjsHandler.js) need to persist Yjs binary state to
// MongoDB and create version history entries. Rather than duplicating that
// logic, both call into this service.
//
// HOW THIS FITS WITH THE REST API:
//   - documentController.saveSnapshot (POST /api/documents/:docId/snapshot)
//     still exists for manual/REST-triggered snapshots.
//   - yjsHandler.js calls saveDocumentSnapshot on a debounced interval
//     whenever connected clients edit a document in real-time.
//   - Both paths write to the same Document.yjsState field and the same
//     DocumentVersion collection — no conflict because the Yjs binary state
//     is a CRDT (merges are commutative, so the "latest state" is always
//     the correct merged state regardless of who persisted last).
//
// VERSION HISTORY THROTTLE:
//   The live yjsState on the Document model is updated on every debounced
//   save (every few seconds of inactivity). But creating a DocumentVersion
//   entry on every save would flood the version history. So we throttle
//   version creation to at most one auto-save version per 5 minutes per
//   document, keeping version history browsable. Named/manual versions
//   (isNamedVersion=true) are never throttled.

const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Whiteboard = require("../models/Whiteboard");

const VERSION_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

// In-memory map: docId -> last auto-version timestamp
// WHY in-memory: version throttle is ephemeral — if the server restarts,
// the worst case is one extra version entry, which is harmless.
const lastVersionTimestamp = new Map();

/**
 * Persist a Yjs state snapshot for a document.
 * Updates the live yjsState AND creates a version history entry (throttled).
 *
 * @param {string} docId - Document MongoDB _id
 * @param {Buffer} yjsStateBuffer - Yjs binary state (Y.encodeStateAsUpdate result)
 * @param {string} userId - User who triggered the save (for "savedBy" in version history)
 * @param {object} [options]
 * @param {boolean} [options.forceVersion=false] - If true, always create a version entry (skip throttle)
 * @param {string}  [options.label=""] - Optional label for named versions
 */
const saveDocumentSnapshot = async (docId, yjsStateBuffer, userId, options = {}) => {
  const { forceVersion = false, label = "" } = options;

  // Update the live yjsState on the Document model
  await Document.findByIdAndUpdate(docId, {
    yjsState: yjsStateBuffer,
    lastEditedBy: userId,
  });

  // Decide whether to create a version history entry
  const now = Date.now();
  const lastVersion = lastVersionTimestamp.get(docId) || 0;
  const shouldCreateVersion = forceVersion || (now - lastVersion >= VERSION_THROTTLE_MS);

  if (shouldCreateVersion) {
    await DocumentVersion.create({
      document: docId,
      yjsState: yjsStateBuffer,
      savedBy: userId,
      label,
      isNamedVersion: !!label,
    });
    lastVersionTimestamp.set(docId, now);
  }
};

/**
 * Persist a Yjs state snapshot for a whiteboard.
 * Whiteboards don't have version history (no DocumentVersion equivalent),
 * so this just updates the live yjsState.
 *
 * @param {string} wbId - Whiteboard MongoDB _id
 * @param {Buffer} yjsStateBuffer - Yjs binary state
 * @param {string} userId - User who triggered the save
 */
const saveWhiteboardSnapshot = async (wbId, yjsStateBuffer, userId) => {
  await Whiteboard.findByIdAndUpdate(wbId, {
    yjsState: yjsStateBuffer,
    lastEditedBy: userId,
  });
};

module.exports = { saveDocumentSnapshot, saveWhiteboardSnapshot };
