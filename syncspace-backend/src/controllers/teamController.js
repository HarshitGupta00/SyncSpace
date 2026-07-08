// controllers/teamController.js

const Team = require("../models/Team");
const TeamMember = require("../models/TeamMember");
const Project = require("../models/Project");
const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Whiteboard = require("../models/Whiteboard");
const Comment = require("../models/Comment");
const Invite = require("../models/Invite");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// @desc    Create a new team
// @route   POST /api/teams
// @access  Protected
exports.createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const team = await Team.create({
    name,
    description,
    owner: req.user._id,
  });

  // Creator automatically becomes owner in TeamMember join collection
  await TeamMember.create({
    user: req.user._id,
    team: team._id,
    role: "owner",
  });

  return sendSuccess(res, { team }, "Team created successfully", 201);
});

// @desc    Get all teams the current user belongs to
// @route   GET /api/teams
// @access  Protected
exports.getMyTeams = asyncHandler(async (req, res) => {
  const memberships = await TeamMember.find({ user: req.user._id })
    .populate("team")
    .lean();

  const teams = memberships.map((m) => ({
    ...m.team,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  return sendSuccess(res, { teams });
});

// @desc    Get a single team with its members
// @route   GET /api/teams/:teamId
// @access  Protected (must be a member)
exports.getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).lean();
  if (!team) return sendError(res, "Team not found", 404);

  // Check requesting user is actually a member
  const membership = await TeamMember.findOne({
    user: req.user._id,
    team: team._id,
  });
  if (!membership) return sendError(res, "Not a member of this team", 403);

  // Fetch all members with their user info
  const members = await TeamMember.find({ team: team._id })
    .populate("user", "name email avatar")
    .lean();

  return sendSuccess(res, {
    team,
    members: members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    myRole: membership.role,
  });
});

// @desc    Update team name/description
// @route   PATCH /api/teams/:teamId
// @access  Protected (owner/admin only)
exports.updateTeam = asyncHandler(async (req, res) => {
  const membership = await TeamMember.findOne({
    user: req.user._id,
    team: req.params.teamId,
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return sendError(res, "Not authorized to update this team", 403);
  }

  const allowed = ["name", "description", "logo"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const team = await Team.findByIdAndUpdate(req.params.teamId, updates, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, { team }, "Team updated");
});

// @desc    Delete a team
// @route   DELETE /api/teams/:teamId
// @access  Protected (owner only)
//
// CASCADING DELETES (Task 4):
// Deleting a team removes ALL its children: projects, documents, whiteboards,
// comments, version history, pending invites, team memberships, and Pinecone
// vector indexes.
//
// DESIGN DECISION: We CASCADE-DELETE rather than reassigning orphaned projects
// to individual users. Rationale: reassigning team projects to personal space
// would expose team-only content to the wrong person and create confusing
// ownership. Users should export data before team deletion.
//
// NOTE ON ATOMICITY: These deletes are sequenced WITHOUT a MongoDB transaction
// because transactions require a replica set (Atlas has it, local mongod does not
// by default). If a step fails partway through, orphaned records may remain.
// A periodic cleanup job could handle this in production.
exports.deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) return sendError(res, "Team not found", 404);

  // Only the original owner (Team.owner field) can delete — not just any "owner" role
  if (team.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the team creator can delete the team", 403);
  }

  // 1. Find all projects belonging to this team
  const projects = await Project.find({ team: req.params.teamId }).select("_id").lean();
  const projectIds = projects.map((p) => p._id);

  if (projectIds.length > 0) {
    // 2. Find all documents and whiteboards in those projects
    const documents = await Document.find({ project: { $in: projectIds } }).select("_id").lean();
    const docIds = documents.map((d) => d._id);

    const whiteboards = await Whiteboard.find({ project: { $in: projectIds } }).select("_id").lean();
    const wbIds = whiteboards.map((w) => w._id);

    // 3. Delete comments on those docs and whiteboards
    if (docIds.length > 0) {
      await Comment.deleteMany({ target: { $in: docIds }, targetType: "Document" });
    }
    if (wbIds.length > 0) {
      await Comment.deleteMany({ target: { $in: wbIds }, targetType: "Whiteboard" });
    }

    // 4. Delete version history for those documents
    if (docIds.length > 0) {
      await DocumentVersion.deleteMany({ document: { $in: docIds } });
    }

    // 5. Clean up Pinecone vector indexes (best-effort)
    const { deleteDocumentIndex } = require("../services/ragService");
    for (const docId of docIds) {
      try {
        await deleteDocumentIndex(docId.toString());
      } catch (err) {
        console.warn(`[deleteTeam] Pinecone cleanup failed for doc ${docId}:`, err.message);
      }
    }

    // 6. Delete documents and whiteboards
    if (docIds.length > 0) await Document.deleteMany({ project: { $in: projectIds } });
    if (wbIds.length > 0) await Whiteboard.deleteMany({ project: { $in: projectIds } });

    // 7. Delete the projects
    await Project.deleteMany({ team: req.params.teamId });
  }

  // 8. Delete all pending invites for this team
  await Invite.deleteMany({ team: req.params.teamId });

  // 9. Clean up all memberships for this team
  await TeamMember.deleteMany({ team: req.params.teamId });

  // 10. Delete the team itself
  await Team.findByIdAndDelete(req.params.teamId);

  return sendSuccess(res, {}, "Team deleted");
});

// @desc    Update a member's role
// @route   PATCH /api/teams/:teamId/members/:userId
// @access  Protected (owner/admin only)
//
// TASK 5 FIX: Now protects the team owner — cannot have their role changed
// via this endpoint. Ownership transfer is a separate endpoint.
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["admin", "member"].includes(role)) {
    return sendError(res, "Invalid role. Must be admin or member", 400);
  }

  const requesterMembership = await TeamMember.findOne({
    user: req.user._id,
    team: req.params.teamId,
  });

  if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
    return sendError(res, "Not authorized", 403);
  }

  // TASK 5 FIX: Protect the team owner from role changes
  const targetMembership = await TeamMember.findOne({
    user: req.params.userId,
    team: req.params.teamId,
  });
  if (!targetMembership) return sendError(res, "Member not found", 404);

  if (targetMembership.role === "owner") {
    return sendError(
      res,
      "Cannot change the team owner's role. Use POST /api/teams/:teamId/transfer-ownership instead.",
      403
    );
  }

  const updated = await TeamMember.findOneAndUpdate(
    { user: req.params.userId, team: req.params.teamId },
    { role },
    { new: true }
  ).populate("user", "name email avatar");

  return sendSuccess(res, { member: updated }, "Role updated");
});

// @desc    Remove a member from the team
// @route   DELETE /api/teams/:teamId/members/:userId
// @access  Protected (owner/admin only, or the user themselves leaving)
//
// TASK 5 FIX: The team owner cannot be removed (not even by themselves — they
// must transfer ownership first). Prevents accidental orphaning of the team.
exports.removeMember = asyncHandler(async (req, res) => {
  const isSelf = req.params.userId === req.user._id.toString();

  // Check if target is the team owner — owners can't be removed
  const targetMembership = await TeamMember.findOne({
    user: req.params.userId,
    team: req.params.teamId,
  });
  if (!targetMembership) return sendError(res, "Member not found", 404);

  if (targetMembership.role === "owner") {
    return sendError(
      res,
      "Cannot remove the team owner. Transfer ownership first via POST /api/teams/:teamId/transfer-ownership.",
      403
    );
  }

  if (!isSelf) {
    const requesterMembership = await TeamMember.findOne({
      user: req.user._id,
      team: req.params.teamId,
    });
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return sendError(res, "Not authorized to remove members", 403);
    }
  }

  await TeamMember.findOneAndDelete({
    user: req.params.userId,
    team: req.params.teamId,
  });

  return sendSuccess(res, {}, isSelf ? "Left team" : "Member removed");
});

// @desc    Transfer team ownership to another member
// @route   POST /api/teams/:teamId/transfer-ownership
// @access  Protected (current owner only)
//
// TASK 5: Explicit ownership transfer endpoint. The previous owner's role
// is downgraded to "admin" and the new owner gets the "owner" role.
// The Team.owner field is also updated so the safety-net check in deleteTeam
// stays correct.
exports.transferOwnership = asyncHandler(async (req, res) => {
  const { newOwnerId } = req.body;
  if (!newOwnerId) return sendError(res, "newOwnerId is required", 400);

  const team = await Team.findById(req.params.teamId);
  if (!team) return sendError(res, "Team not found", 404);

  // Only the current owner can transfer ownership
  if (team.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the current team owner can transfer ownership", 403);
  }

  // Verify the new owner is a current team member
  const newOwnerMembership = await TeamMember.findOne({
    user: newOwnerId,
    team: req.params.teamId,
  });
  if (!newOwnerMembership) {
    return sendError(res, "New owner must be a current team member", 404);
  }

  // Can't transfer to yourself
  if (newOwnerId === req.user._id.toString()) {
    return sendError(res, "You are already the owner", 400);
  }

  // Downgrade current owner to admin
  await TeamMember.findOneAndUpdate(
    { user: req.user._id, team: req.params.teamId },
    { role: "admin" }
  );

  // Upgrade new owner
  await TeamMember.findOneAndUpdate(
    { user: newOwnerId, team: req.params.teamId },
    { role: "owner" }
  );

  // Update the Team.owner field (safety-net for deleteTeam)
  team.owner = newOwnerId;
  await team.save();

  return sendSuccess(res, {}, "Ownership transferred successfully");
});
