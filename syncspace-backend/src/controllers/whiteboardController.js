// controllers/whiteboardController.js
// Mirrors documentController structure — same access control pattern,
// same Yjs snapshot persistence, but for whiteboards.

const Whiteboard = require("../models/Whiteboard");
const Project = require("../models/Project");
const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const getProjectWithAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) return { error: "Project not found", status: 404 };
  if (project.team) {
    const membership = await TeamMember.findOne({ user: userId, team: project.team });
    if (!membership) return { error: "Access denied", status: 403 };
    return { project, role: membership.role };
  } else {
    if (project.owner.toString() !== userId.toString()) return { error: "Access denied", status: 403 };
    return { project, role: "owner" };
  }
};

exports.createWhiteboard = asyncHandler(async (req, res) => {
  const { title, projectId } = req.body;
  const { error, status } = await getProjectWithAccess(projectId, req.user._id);
  if (error) return sendError(res, error, status);

  const whiteboard = await Whiteboard.create({
    title: title || "Untitled Whiteboard",
    project: projectId,
    owner: req.user._id,
  });

  return sendSuccess(res, { whiteboard }, "Whiteboard created", 201);
});

exports.getWhiteboards = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return sendError(res, "projectId is required", 400);

  const { error, status } = await getProjectWithAccess(projectId, req.user._id);
  if (error) return sendError(res, error, status);

  const whiteboards = await Whiteboard.find({ project: projectId })
    .populate("owner", "name avatar")
    .select("-yjsState")
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, { whiteboards });
});

exports.getWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.wbId)
    .populate("owner", "name avatar")
    .select("-yjsState")
    .lean();

  if (!whiteboard) return sendError(res, "Whiteboard not found", 404);

  const { error, status } = await getProjectWithAccess(whiteboard.project, req.user._id);
  if (error) return sendError(res, error, status);

  return sendSuccess(res, { whiteboard });
});

exports.updateWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.wbId);
  if (!whiteboard) return sendError(res, "Whiteboard not found", 404);

  const { error, status } = await getProjectWithAccess(whiteboard.project, req.user._id);
  if (error) return sendError(res, error, status);

  const allowed = ["title", "description", "background", "settings"];
  const updates = { lastEditedBy: req.user._id };
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Whiteboard.findByIdAndUpdate(req.params.wbId, updates, {
    new: true, runValidators: true,
  }).select("-yjsState");

  return sendSuccess(res, { whiteboard: updated }, "Whiteboard updated");
});

exports.deleteWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.wbId);
  if (!whiteboard) return sendError(res, "Whiteboard not found", 404);

  if (whiteboard.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the whiteboard owner can delete it", 403);
  }

  await Whiteboard.findByIdAndDelete(req.params.wbId);
  return sendSuccess(res, {}, "Whiteboard deleted");
});

exports.saveSnapshot = asyncHandler(async (req, res) => {
  const { yjsState } = req.body;
  const buffer = Buffer.from(yjsState, "base64");

  await Whiteboard.findByIdAndUpdate(req.params.wbId, {
    yjsState: buffer,
    lastEditedBy: req.user._id,
  });

  return sendSuccess(res, {}, "Snapshot saved");
});
