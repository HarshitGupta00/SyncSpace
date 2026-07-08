// controllers/whiteboardController.js
// Mirrors documentController structure — same access control pattern,
// same Yjs snapshot persistence, but for whiteboards.
//
// Now uses the shared permissionService instead of a duplicated
// getProjectWithAccess helper — same refactor as documentController.

const Whiteboard = require("../models/Whiteboard");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  ROLE_WEIGHT,
  resolveProjectAccess,
  resolveWhiteboardAccess,
} = require("../services/permissionService");

// @desc    Create a whiteboard inside a project
// @route   POST /api/whiteboards
// @access  Protected (editor or above)
exports.createWhiteboard = asyncHandler(async (req, res) => {
  const { title, projectId } = req.body;

  const result = await resolveProjectAccess(req.user._id, projectId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to create whiteboards", 403);
  }

  const whiteboard = await Whiteboard.create({
    title: title || "Untitled Whiteboard",
    project: projectId,
    owner: req.user._id,
  });

  return sendSuccess(res, { whiteboard }, "Whiteboard created", 201);
});

// @desc    Get all whiteboards in a project
// @route   GET /api/whiteboards?projectId=xxx
// @access  Protected (viewer or above)
exports.getWhiteboards = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return sendError(res, "projectId is required", 400);

  const result = await resolveProjectAccess(req.user._id, projectId);
  if (result.error) return sendError(res, result.error, result.status);

  const whiteboards = await Whiteboard.find({ project: projectId })
    .populate("owner", "name avatar")
    .select("-yjsState")
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, { whiteboards });
});

// @desc    Get a single whiteboard (metadata only)
// @route   GET /api/whiteboards/:wbId
// @access  Protected (viewer or above)
exports.getWhiteboard = asyncHandler(async (req, res) => {
  const result = await resolveWhiteboardAccess(req.user._id, req.params.wbId);
  if (result.error) return sendError(res, result.error, result.status);

  const whiteboard = await Whiteboard.findById(req.params.wbId)
    .populate("owner", "name avatar")
    .select("-yjsState")
    .lean();

  return sendSuccess(res, { whiteboard, effectiveRole: result.effectiveRole });
});

// @desc    Update whiteboard metadata (title, description, background, settings)
// @route   PATCH /api/whiteboards/:wbId
// @access  Protected (editor or above)
exports.updateWhiteboard = asyncHandler(async (req, res) => {
  const result = await resolveWhiteboardAccess(req.user._id, req.params.wbId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to update this whiteboard", 403);
  }

  const allowed = ["title", "description", "background", "settings"];
  const updates = { lastEditedBy: req.user._id };
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Whiteboard.findByIdAndUpdate(req.params.wbId, updates, {
    new: true, runValidators: true,
  }).select("-yjsState");

  return sendSuccess(res, { whiteboard: updated }, "Whiteboard updated");
});

// @desc    Delete a whiteboard
// @route   DELETE /api/whiteboards/:wbId
// @access  Protected (owner only)
//
// CASCADING DELETE: Also removes all comments on this whiteboard.
exports.deleteWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.wbId);
  if (!whiteboard) return sendError(res, "Whiteboard not found", 404);

  if (whiteboard.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the whiteboard owner can delete it", 403);
  }

  // Delete all comments on this whiteboard
  await Comment.deleteMany({ target: req.params.wbId, targetType: "Whiteboard" });

  await Whiteboard.findByIdAndDelete(req.params.wbId);
  return sendSuccess(res, {}, "Whiteboard deleted");
});

// @desc    Save a Yjs snapshot for a whiteboard
// @route   POST /api/whiteboards/:wbId/snapshot
// @access  Protected (editor or above)
//
// TASK 3 FIX: Previously had no access check on snapshot save.
exports.saveSnapshot = asyncHandler(async (req, res) => {
  const { yjsState } = req.body;

  const result = await resolveWhiteboardAccess(req.user._id, req.params.wbId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to save snapshots", 403);
  }

  const buffer = Buffer.from(yjsState, "base64");
  const { saveWhiteboardSnapshot } = require("../services/snapshotService");
  await saveWhiteboardSnapshot(req.params.wbId, buffer, req.user._id);

  return sendSuccess(res, {}, "Snapshot saved");
});
