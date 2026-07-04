// controllers/projectController.js

const Project = require("../models/Project");
const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Helper: verify user has access to a team (any role)
const verifyTeamMember = async (userId, teamId) => {
  return TeamMember.findOne({ user: userId, team: teamId });
};

// @desc    Create a project (team or personal)
// @route   POST /api/projects
// @access  Protected
exports.createProject = asyncHandler(async (req, res) => {
  const { name, description, teamId, icon, color } = req.body;

  // If teamId is provided, verify user is a member of that team
  if (teamId) {
    const membership = await verifyTeamMember(req.user._id, teamId);
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
    const membership = await verifyTeamMember(req.user._id, teamId);
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
// @access  Protected
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate("owner", "name avatar")
    .lean();

  if (!project) return sendError(res, "Project not found", 404);

  // Access check: personal project (only owner) or team project (any member)
  if (project.team) {
    const membership = await verifyTeamMember(req.user._id, project.team);
    if (!membership) return sendError(res, "Access denied", 403);
  } else {
    if (project.owner._id.toString() !== req.user._id.toString()) {
      return sendError(res, "Access denied", 403);
    }
  }

  return sendSuccess(res, { project });
});

// @desc    Update project
// @route   PATCH /api/projects/:projectId
// @access  Protected (owner or team admin/owner)
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return sendError(res, "Project not found", 404);

  // Authorization check
  if (project.team) {
    const membership = await verifyTeamMember(req.user._id, project.team);
    if (!membership || membership.role === "member") {
      return sendError(res, "Only team admin/owner can update projects", 403);
    }
  } else {
    if (project.owner.toString() !== req.user._id.toString()) {
      return sendError(res, "Access denied", 403);
    }
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
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return sendError(res, "Project not found", 404);

  const isOwner = project.owner.toString() === req.user._id.toString();
  if (!isOwner) return sendError(res, "Only the project owner can delete it", 403);

  await Project.findByIdAndDelete(req.params.projectId);

  return sendSuccess(res, {}, "Project deleted");
});
