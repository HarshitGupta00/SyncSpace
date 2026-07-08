// controllers/projectController.js

const Project = require("../models/Project");
const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Whiteboard = require("../models/Whiteboard");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  ROLE_WEIGHT,
  resolveProjectAccess,
  getEffectiveRole,
  canEdit,
} = require("../services/permissionService");

// @desc    Create a project (team or personal)
// @route   POST /api/projects
// @access  Protected
exports.createProject = asyncHandler(async (req, res) => {
  const { name, description, teamId, icon, color } = req.body;

  // If teamId is provided, verify user is a member of that team
  if (teamId) {
    const { error, status } = await resolveProjectAccess(req.user._id, teamId);
    // For project creation, we just need team membership — resolveProjectAccess
    // checks that. But since we're creating a NEW project (not accessing an existing
    // one), we use a simpler check: just verify they're a team member.
    const TeamMember = require("../models/TeamMember");
    const membership = await TeamMember.findOne({ user: req.user._id, team: teamId });
    if (!membership) return sendError(res, "Not a member of this team", 403);
  }

  const project = await Project.create({
    name,
    description,
    icon,
    color,
    team: teamId || null, // null = personal project
    owner: req.user._id,
  });

  return sendSuccess(res, { project }, "Project created", 201);
});

// @desc    Get all projects (team OR personal depending on query)
// @route   GET /api/projects?teamId=xxx  (team projects)
// @route   GET /api/projects             (personal projects)
// @access  Protected
exports.getProjects = asyncHandler(async (req, res) => {
  const { teamId } = req.query;

  let query;

  if (teamId) {
    // Team projects — verify membership first
    const TeamMember = require("../models/TeamMember");
    const membership = await TeamMember.findOne({ user: req.user._id, team: teamId });
    if (!membership) return sendError(res, "Not a member of this team", 403);
    query = { team: teamId };
  } else {
    // Personal projects — only owned by this user with no team
    query = { team: null, owner: req.user._id };
  }

  const projects = await Project.find(query)
    .populate("owner", "name avatar")
    .sort({ updatedAt: -1 }) // most recently updated first
    .lean();

  return sendSuccess(res, { projects });
});

// @desc    Get single project
// @route   GET /api/projects/:projectId
// @access  Protected (any role — viewers can see project metadata)
exports.getProject = asyncHandler(async (req, res) => {
  const result = await resolveProjectAccess(req.user._id, req.params.projectId);
  if (result.error) return sendError(res, result.error, result.status);

  // Re-fetch with population since resolveProjectAccess returns lean
  const project = await Project.findById(req.params.projectId)
    .populate("owner", "name avatar")
    .lean();

  return sendSuccess(res, { project, effectiveRole: result.effectiveRole });
});

// @desc    Update project
// @route   PATCH /api/projects/:projectId
// @access  Protected (editor or above)
exports.updateProject = asyncHandler(async (req, res) => {
  const result = await resolveProjectAccess(req.user._id, req.params.projectId);
  if (result.error) return sendError(res, result.error, result.status);

  // Require editor-level access to update project metadata
  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to update this project", 403);
  }

  const allowed = ["name", "description", "status", "progress", "icon", "color"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Project.findByIdAndUpdate(req.params.projectId, updates, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, { project: updated }, "Project updated");
});

// @desc    Delete project
// @route   DELETE /api/projects/:projectId
// @access  Protected (owner only)
//
// CASCADING DELETES: Deleting a project also deletes all its documents,
// whiteboards, their comments, version history, and Pinecone vector indexes.
// We sequence these deletes without a MongoDB transaction because transactions
// require a replica set (available on Atlas, not always on local dev). If any
// step fails partway through, orphaned records may remain — acceptable for
// this stage; a cleanup job could be added later.
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return sendError(res, "Project not found", 404);

  const isOwner = project.owner.toString() === req.user._id.toString();
  if (!isOwner) return sendError(res, "Only the project owner can delete it", 403);

  // --- Cascade delete all children ---
  const documents = await Document.find({ project: project._id }).select("_id").lean();
  const docIds = documents.map((d) => d._id);

  const whiteboards = await Whiteboard.find({ project: project._id }).select("_id").lean();
  const wbIds = whiteboards.map((w) => w._id);

  // Delete comments on all docs and whiteboards in this project
  if (docIds.length > 0) {
    await Comment.deleteMany({ target: { $in: docIds }, targetType: "Document" });
    await DocumentVersion.deleteMany({ document: { $in: docIds } });
  }
  if (wbIds.length > 0) {
    await Comment.deleteMany({ target: { $in: wbIds }, targetType: "Whiteboard" });
  }

  // Clean up Pinecone vector indexes for each document (best-effort)
  const { deleteDocumentIndex } = require("../services/ragService");
  for (const docId of docIds) {
    try {
      await deleteDocumentIndex(docId.toString());
    } catch (err) {
      console.warn(`[deleteProject] Pinecone cleanup failed for doc ${docId}:`, err.message);
    }
  }

  // Delete the documents and whiteboards themselves
  if (docIds.length > 0) await Document.deleteMany({ project: project._id });
  if (wbIds.length > 0) await Whiteboard.deleteMany({ project: project._id });

  // Finally, delete the project
  await Project.findByIdAndDelete(req.params.projectId);

  return sendSuccess(res, {}, "Project deleted");
});

// @desc    Set or clear a member's project-level role override
// @route   PATCH /api/projects/:projectId/members/:userId/role
// @access  Protected (team owner/admin or project editor can set overrides)
//
// This endpoint adds/updates/removes a per-project role override for a specific
// user. To REMOVE an override (revert to team-inherited role), send { role: null }.
exports.setMemberProjectRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { projectId, userId } = req.params;

  // Validate the role value
  if (role !== null && !["viewer", "commenter", "editor"].includes(role)) {
    return sendError(res, "Invalid role. Must be viewer, commenter, editor, or null (to remove)", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) return sendError(res, "Project not found", 404);

  // Authorization: must be editor-or-above on this project
  const requesterRole = await getEffectiveRole(req.user._id, project);
  if (!requesterRole || ROLE_WEIGHT[requesterRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "Not authorized to change project roles", 403);
  }

  // Verify target user is actually a team member (for team projects)
  if (project.team) {
    const TeamMember = require("../models/TeamMember");
    const membership = await TeamMember.findOne({ user: userId, team: project.team });
    if (!membership) return sendError(res, "User is not a member of this team", 404);
  }

  // Update the memberOverrides array
  const overrides = project.memberOverrides || [];
  const existingIdx = overrides.findIndex(
    (o) => o.user && o.user.toString() === userId
  );

  if (role === null) {
    // Remove override — revert to inherited team role
    if (existingIdx !== -1) overrides.splice(existingIdx, 1);
  } else {
    if (existingIdx !== -1) {
      overrides[existingIdx].role = role;
    } else {
      overrides.push({ user: userId, role });
    }
  }

  project.memberOverrides = overrides;
  await project.save();

  return sendSuccess(res, { project }, "Project member role updated");
});
