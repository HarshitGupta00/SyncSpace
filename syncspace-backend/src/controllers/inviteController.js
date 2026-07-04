// controllers/inviteController.js

const Invite = require("../models/Invite");
const Team = require("../models/Team");
const TeamMember = require("../models/TeamMember");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { generateInviteToken, verifyInviteToken, buildInviteLink } = require("../services/inviteTokenService");
const { sendInviteEmail } = require("../services/emailService");

// @desc    Send invite(s) to join a team
// @route   POST /api/invites
// @access  Protected (team owner/admin only)
exports.sendInvites = asyncHandler(async (req, res) => {
  const { teamId, emails, role = "member" } = req.body;
  // emails is an array: ["rahul@gmail.com", "priya@gmail.com"]

  // Verify requester is owner/admin of this team
  const membership = await TeamMember.findOne({ user: req.user._id, team: teamId });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return sendError(res, "Only team owners/admins can invite members", 403);
  }

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, "Team not found", 404);

  const results = { sent: [], skipped: [] };

  for (const email of emails) {
    // Skip if already a team member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember = await TeamMember.findOne({ user: existingUser._id, team: teamId });
      if (alreadyMember) {
        results.skipped.push({ email, reason: "Already a member" });
        continue;
      }
    }

    // Skip if a pending invite already exists (handled by partial unique index in DB,
    // but we check here too for a friendlier error message)
    const existingInvite = await Invite.findOne({ team: teamId, email, status: "pending" });
    if (existingInvite) {
      results.skipped.push({ email, reason: "Invite already pending" });
      continue;
    }

    // Create invite DB record
    const invite = await Invite.create({
      team: teamId,
      email,
      role,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    });

    // Generate JWT token carrying only the invite's DB _id
    const token = generateInviteToken(invite._id);
    const inviteLink = buildInviteLink(token);

    // Send email
    await sendInviteEmail({
      toEmail: email,
      inviterName: req.user.name,
      teamName: team.name,
      inviteLink,
      role,
    });

    results.sent.push({ email });
  }

  return sendSuccess(res, results, `Invites processed`);
});

// @desc    Preview invite details from token (shown on the accept-invite page)
// @route   GET /api/invites/preview?token=xxx
// @access  Public
exports.previewInvite = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return sendError(res, "Token is required", 400);

  // Verify JWT signature + expiry
  const decoded = verifyInviteToken(token);
  // throws if invalid — caught by errorMiddleware

  const invite = await Invite.findById(decoded.inviteId)
    .populate("team", "name logo")
    .populate("invitedBy", "name email");

  if (!invite) return sendError(res, "Invite not found", 404);
  if (invite.status !== "pending") {
    return sendError(res, `This invite has already been ${invite.status}`, 400);
  }
  if (invite.expiresAt < new Date()) {
    await Invite.findByIdAndUpdate(invite._id, { status: "expired" });
    return sendError(res, "This invite has expired", 410); // 410 Gone
  }

  // Return invite details for the accept-invite page UI
  return sendSuccess(res, {
    team: invite.team,
    invitedBy: invite.invitedBy,
    role: invite.role,
    email: invite.email,
    expiresAt: invite.expiresAt,
  });
});

// @desc    Accept an invite
// @route   POST /api/invites/accept
// @access  Protected (must be logged in as the invited email)
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const decoded = verifyInviteToken(token);
  const invite = await Invite.findById(decoded.inviteId);

  if (!invite) return sendError(res, "Invite not found", 404);
  if (invite.status !== "pending") {
    return sendError(res, `This invite has already been ${invite.status}`, 400);
  }
  if (invite.expiresAt < new Date()) {
    await Invite.findByIdAndUpdate(invite._id, { status: "expired" });
    return sendError(res, "This invite has expired", 410);
  }

  // Security: the logged-in user's email must match the invite's email
  if (req.user.email !== invite.email) {
    return sendError(res, "This invite was sent to a different email address", 403);
  }

  // Add to team
  await TeamMember.create({
    user: req.user._id,
    team: invite.team,
    role: invite.role,
  });

  // Mark invite as accepted — prevents reuse
  await Invite.findByIdAndUpdate(invite._id, { status: "accepted" });

  return sendSuccess(res, {}, "Successfully joined the team");
});

// @desc    Decline an invite
// @route   POST /api/invites/decline
// @access  Public (no login required to decline)
exports.declineInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const decoded = verifyInviteToken(token);
  const invite = await Invite.findById(decoded.inviteId);

  if (!invite || invite.status !== "pending") {
    return sendError(res, "Invite not found or already processed", 400);
  }

  await Invite.findByIdAndUpdate(invite._id, { status: "declined" });

  return sendSuccess(res, {}, "Invitation declined");
});

// @desc    Get all pending invites for a team
// @route   GET /api/invites/team/:teamId
// @access  Protected (owner/admin only)
exports.getTeamInvites = asyncHandler(async (req, res) => {
  const membership = await TeamMember.findOne({
    user: req.user._id,
    team: req.params.teamId,
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return sendError(res, "Not authorized", 403);
  }

  const invites = await Invite.find({
    team: req.params.teamId,
    status: "pending",
  })
    .populate("invitedBy", "name avatar")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { invites });
});

// @desc    Revoke a pending invite
// @route   DELETE /api/invites/:inviteId
// @access  Protected (owner/admin only)
exports.revokeInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findById(req.params.inviteId);
  if (!invite) return sendError(res, "Invite not found", 404);

  const membership = await TeamMember.findOne({
    user: req.user._id,
    team: invite.team,
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return sendError(res, "Not authorized", 403);
  }

  await Invite.findByIdAndUpdate(invite._id, { status: "expired" });

  return sendSuccess(res, {}, "Invite revoked");
});
