// controllers/documentController.js

const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  ROLE_WEIGHT,
  resolveProjectAccess,
  resolveDocumentAccess,
} = require("../services/permissionService");

// @desc    Create a document inside a project
// @route   POST /api/documents
// @access  Protected (editor or above)
exports.createDocument = asyncHandler(async (req, res) => {
  const { title, projectId } = req.body;

  const result = await resolveProjectAccess(req.user._id, projectId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to create documents", 403);
  }

  const document = await Document.create({
    title: title || "Untitled Document",
    project: projectId,
    owner: req.user._id,
  });

  return sendSuccess(res, { document }, "Document created", 201);
});

// @desc    Get all documents in a project
// @route   GET /api/documents?projectId=xxx
// @access  Protected (viewer or above)
exports.getDocuments = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return sendError(res, "projectId is required", 400);

  const result = await resolveProjectAccess(req.user._id, projectId);
  if (result.error) return sendError(res, result.error, result.status);

  // Any role (viewer+) can list documents
  const documents = await Document.find({ project: projectId })
    .populate("owner", "name avatar")
    .populate("lastEditedBy", "name avatar")
    .select("-yjsState") // never send the binary Yjs state in list views — it's large and not needed
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, { documents });
});

// @desc    Get a single document (metadata only, no yjsState — Yjs loads content via websocket)
// @route   GET /api/documents/:docId
// @access  Protected (viewer or above)
exports.getDocument = asyncHandler(async (req, res) => {
  const result = await resolveDocumentAccess(req.user._id, req.params.docId);
  if (result.error) return sendError(res, result.error, result.status);

  // Re-fetch with population and without yjsState
  const document = await Document.findById(req.params.docId)
    .populate("owner", "name avatar")
    .populate("lastEditedBy", "name avatar")
    .select("-yjsState") // Yjs binary content loaded separately via websocket, not REST
    .lean();

  return sendSuccess(res, { document, effectiveRole: result.effectiveRole });
});

// @desc    Update document metadata (title, description, tags, properties)
// @route   PATCH /api/documents/:docId
// @access  Protected (editor or above)
exports.updateDocument = asyncHandler(async (req, res) => {
  const result = await resolveDocumentAccess(req.user._id, req.params.docId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to update this document", 403);
  }

  const allowed = ["title", "description", "tags", "properties"];
  const updates = { lastEditedBy: req.user._id };
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Document.findByIdAndUpdate(req.params.docId, updates, {
    new: true,
    runValidators: true,
  }).select("-yjsState");

  return sendSuccess(res, { document: updated }, "Document updated");
});

// @desc    Delete a document
// @route   DELETE /api/documents/:docId
// @access  Protected (owner only)
//
// CASCADING DELETES: Also deletes version history, comments, and cleans up
// the Pinecone vector index. Pinecone cleanup is best-effort (wrapped in
// try/catch) so a Pinecone outage doesn't block document deletion.
exports.deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId);
  if (!document) return sendError(res, "Document not found", 404);

  if (document.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the document owner can delete it", 403);
  }

  // Delete all version history for this document
  await DocumentVersion.deleteMany({ document: req.params.docId });

  // Delete all comments on this document
  await Comment.deleteMany({ target: req.params.docId, targetType: "Document" });

  // Clean up Pinecone vector index (best-effort — don't block on failure)
  try {
    const { deleteDocumentIndex } = require("../services/ragService");
    await deleteDocumentIndex(req.params.docId);
  } catch (err) {
    console.warn(`[deleteDocument] Pinecone cleanup failed for doc ${req.params.docId}:`, err.message);
  }

  await Document.findByIdAndDelete(req.params.docId);

  return sendSuccess(res, {}, "Document deleted");
});

// @desc    Save a Yjs snapshot (called by Yjs persistence layer, not directly by user)
// @route   POST /api/documents/:docId/snapshot
// @access  Protected (editor or above)
exports.saveSnapshot = asyncHandler(async (req, res) => {
  const { yjsState } = req.body;

  // Access check — only editors can save snapshots
  const result = await resolveDocumentAccess(req.user._id, req.params.docId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to save snapshots", 403);
  }

  // yjsState comes in as a base64 string (binary can't reliably travel as JSON)
  // We convert back to Buffer before storing
  const buffer = Buffer.from(yjsState, "base64");

  // Delegate to shared snapshotService — same function the Yjs WebSocket handler
  // uses for debounced auto-saves. forceVersion=true because REST-triggered
  // snapshots should always create a version entry (user explicitly saved).
  const { saveDocumentSnapshot } = require("../services/snapshotService");
  await saveDocumentSnapshot(req.params.docId, buffer, req.user._id, { forceVersion: true });

  return sendSuccess(res, {}, "Snapshot saved");
});

// @desc    Get version history for a document
// @route   GET /api/documents/:docId/versions
// @access  Protected (viewer or above)
exports.getVersions = asyncHandler(async (req, res) => {
  const result = await resolveDocumentAccess(req.user._id, req.params.docId);
  if (result.error) return sendError(res, result.error, result.status);

  const versions = await DocumentVersion.find({ document: req.params.docId })
    .populate("savedBy", "name avatar")
    .select("-yjsState") // don't send binary blobs in the list — only fetch on explicit restore
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { versions });
});

// @desc    Restore a specific version
// @route   POST /api/documents/:docId/versions/:versionId/restore
// @access  Protected (editor or above)
exports.restoreVersion = asyncHandler(async (req, res) => {
  // Access check — only editors can restore versions
  const result = await resolveDocumentAccess(req.user._id, req.params.docId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to restore versions", 403);
  }

  const version = await DocumentVersion.findById(req.params.versionId);
  if (!version) return sendError(res, "Version not found", 404);

  // Verify the version actually belongs to this document (prevents
  // restoring a version from a different document by manipulating the URL)
  if (version.document.toString() !== req.params.docId) {
    return sendError(res, "Version does not belong to this document", 400);
  }

  // Overwrite the document's current yjsState with the chosen version's state
  await Document.findByIdAndUpdate(req.params.docId, {
    yjsState: version.yjsState,
    lastEditedBy: req.user._id,
  });

  // Force the live Yjs room to adopt this state so connected clients see it
  // and the next auto-save doesn't revert it.
  try {
    const { forceReplaceRoomState } = require("../sockets/yjsHandler");
    forceReplaceRoomState(`doc:${req.params.docId}`, version.yjsState);
  } catch (err) {
    console.warn(`[restoreVersion] Could not update live Yjs room:`, err.message);
  }

  // Return the binary state as base64 so the frontend Yjs instance can reload it
  // if they aren't currently connected to the live room.
  return sendSuccess(res, {
    yjsState: version.yjsState.toString("base64"),
  }, "Version restored");
});
