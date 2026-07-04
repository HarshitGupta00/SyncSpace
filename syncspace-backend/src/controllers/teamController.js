// controllers/teamController.js

const Team = require("../models/Team");
const TeamMember = require("../models/TeamMember");
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
exports.deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) return sendError(res, "Team not found", 404);

  // Only the original owner (Team.owner field) can delete — not just any "owner" role
  if (team.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the team creator can delete the team", 403);
  }

  await Team.findByIdAndDelete(req.params.teamId);
  // Clean up all memberships for this team
  await TeamMember.deleteMany({ team: req.params.teamId });

  return sendSuccess(res, {}, "Team deleted");
});

// @desc    Update a member's role
// @route   PATCH /api/teams/:teamId/members/:userId
// @access  Protected (owner/admin only)
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

  const updated = await TeamMember.findOneAndUpdate(
    { user: req.params.userId, team: req.params.teamId },
    { role },
    { new: true }
  ).populate("user", "name email avatar");

  if (!updated) return sendError(res, "Member not found", 404);

  return sendSuccess(res, { member: updated }, "Role updated");
});

// @desc    Remove a member from the team
// @route   DELETE /api/teams/:teamId/members/:userId
// @access  Protected (owner/admin only, or the user themselves leaving)
exports.removeMember = asyncHandler(async (req, res) => {
  const isSelf = req.params.userId === req.user._id.toString();

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
