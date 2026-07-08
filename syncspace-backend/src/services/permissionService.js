// services/permissionService.js
// Centralized permission resolution for the two-level permission system.
//
// LEVEL 1: Team role (owner / admin / member) — governs team-wide settings
// LEVEL 2: Project-level override (viewer / commenter / editor) — overrides
//          the inherited team role for a specific project
//
// EFFECTIVE ROLE RESOLUTION:
//   1. Personal project (team is null): if user is the project owner → "owner"
//      (superset of editor). Otherwise → null (no access).
//   2. Team project: look up TeamMember.role for this user+team.
//      Then check Project.memberOverrides for a per-project override.
//      If override exists → use it. Otherwise → map from team role:
//        team owner  → editor
//        team admin  → editor
//        team member → editor
//      Note: all team members default to "editor" within projects they have
//      access to. To restrict someone to viewer/commenter, an explicit
//      override must be set via the setMemberProjectRole endpoint.
//
// ROLE HIERARCHY (highest to lowest):
//   owner > editor > commenter > viewer
//   Each level includes all permissions below it.
//
// FAIL-CLOSED: if a role can't be resolved (user not found in team, project
// doesn't exist, etc.), the functions return null / false — access denied.

const Project = require("../models/Project");
const Document = require("../models/Document");
const Whiteboard = require("../models/Whiteboard");
const TeamMember = require("../models/TeamMember");

// Role hierarchy for comparison — higher number = more permissions
const ROLE_WEIGHT = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  owner: 4, // "owner" is an effective role, not stored in memberOverrides
};

// Default mapping: team role → effective project role (when no override exists)
const TEAM_ROLE_TO_PROJECT_ROLE = {
  owner: "editor",
  admin: "editor",
  member: "editor",
};

/**
 * Resolve the effective project-level role for a user.
 *
 * @param {string|ObjectId} userId
 * @param {Object|string} projectOrId - Project document or its _id
 * @returns {Promise<string|null>} "owner" | "editor" | "commenter" | "viewer" | null
 *   null = no access at all (user is not a member / not the owner)
 */
const getEffectiveRole = async (userId, projectOrId) => {
  // Load project if an ID was passed
  const project = typeof projectOrId === "object" && projectOrId.owner
    ? projectOrId
    : await Project.findById(projectOrId).lean();

  if (!project) return null; // project doesn't exist → no access

  const uid = userId.toString();

  // --- Personal project (no team) ---
  if (!project.team) {
    // Only the owner has access to personal projects
    if (project.owner.toString() === uid) return "owner";
    return null; // no access
  }

  // --- Team project ---
  const membership = await TeamMember.findOne({
    user: userId,
    team: project.team,
  }).lean();

  if (!membership) return null; // not a team member → no access

  // Check for a per-project override
  const override = (project.memberOverrides || []).find(
    (o) => o.user && o.user.toString() === uid
  );

  if (override) return override.role; // explicit override wins

  // No override → map from team role
  return TEAM_ROLE_TO_PROJECT_ROLE[membership.role] || null;
};

// ── Boolean permission helpers ────────────────────────────────────────

const canView = async (userId, projectOrId) => {
  const role = await getEffectiveRole(userId, projectOrId);
  return role !== null; // any role (even viewer) can view
};

const canComment = async (userId, projectOrId) => {
  const role = await getEffectiveRole(userId, projectOrId);
  return role !== null && ROLE_WEIGHT[role] >= ROLE_WEIGHT.commenter;
};

const canEdit = async (userId, projectOrId) => {
  const role = await getEffectiveRole(userId, projectOrId);
  return role !== null && ROLE_WEIGHT[role] >= ROLE_WEIGHT.editor;
};

const canManage = async (userId, projectOrId) => {
  const role = await getEffectiveRole(userId, projectOrId);
  return role === "owner";
};

// ── Access resolution helpers (replaces duplicated getProjectWithAccess) ──

/**
 * Resolve project access for a user. Throws-style: returns the project and
 * effective role, or returns an error object { error, status }.
 *
 * Replaces the duplicated `getProjectWithAccess` / `verifyTeamMember` helpers
 * that were copy-pasted across projectController, documentController, and
 * whiteboardController.
 *
 * @param {string|ObjectId} userId
 * @param {string} projectId
 * @returns {Promise<{project, effectiveRole}|{error, status}>}
 */
const resolveProjectAccess = async (userId, projectId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) return { error: "Project not found", status: 404 };

  const effectiveRole = await getEffectiveRole(userId, project);
  if (!effectiveRole) return { error: "Access denied", status: 403 };

  return { project, effectiveRole };
};

/**
 * Resolve access for a document — loads the document, finds its project,
 * then checks project access.
 *
 * @param {string|ObjectId} userId
 * @param {string} docId
 * @returns {Promise<{document, project, effectiveRole}|{error, status}>}
 */
const resolveDocumentAccess = async (userId, docId) => {
  const document = await Document.findById(docId).lean();
  if (!document) return { error: "Document not found", status: 404 };

  const access = await resolveProjectAccess(userId, document.project);
  if (access.error) return access;

  return { document, project: access.project, effectiveRole: access.effectiveRole };
};

/**
 * Resolve access for a whiteboard — loads the whiteboard, finds its project,
 * then checks project access.
 *
 * @param {string|ObjectId} userId
 * @param {string} wbId
 * @returns {Promise<{whiteboard, project, effectiveRole}|{error, status}>}
 */
const resolveWhiteboardAccess = async (userId, wbId) => {
  const whiteboard = await Whiteboard.findById(wbId).lean();
  if (!whiteboard) return { error: "Whiteboard not found", status: 404 };

  const access = await resolveProjectAccess(userId, whiteboard.project);
  if (access.error) return access;

  return { whiteboard, project: access.project, effectiveRole: access.effectiveRole };
};

module.exports = {
  ROLE_WEIGHT,
  getEffectiveRole,
  canView,
  canComment,
  canEdit,
  canManage,
  resolveProjectAccess,
  resolveDocumentAccess,
  resolveWhiteboardAccess,
};
