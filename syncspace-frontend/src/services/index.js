// services/index.js
// All API service modules — one import for all API calls.
// Each service maps directly to a backend route group.

import api from "./api";

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  signup:   (data) => api.post("/auth/signup", data),
  login:    (data) => api.post("/auth/login", data),
  getMe:    ()     => api.get("/auth/me"),
  updateMe: (data) => api.patch("/auth/me", data),
};

// ── Users (public profiles) ───────────────────────────────────
// New endpoint added in backend: GET /api/users/:userId
// Returns public-safe profile (name, avatar, bio, skills, location, timezone)
// Used for: team member hover cards, @mention picker, comment author profiles
export const userService = {
  getUserProfile: (userId) => api.get(`/users/${userId}`),
};

// ── Teams ─────────────────────────────────────────────────────
export const teamService = {
  getMyTeams:       ()                    => api.get("/teams"),
  createTeam:       (data)               => api.post("/teams", data),
  getTeam:          (teamId)             => api.get(`/teams/${teamId}`),
  updateTeam:       (teamId, data)       => api.patch(`/teams/${teamId}`, data),
  deleteTeam:       (teamId)             => api.delete(`/teams/${teamId}`),
  updateMemberRole: (teamId, userId, role) => api.patch(`/teams/${teamId}/members/${userId}`, { role }),
  removeMember:     (teamId, userId)     => api.delete(`/teams/${teamId}/members/${userId}`),
};

// ── Projects ──────────────────────────────────────────────────
export const projectService = {
  getProjects:   (teamId)          => api.get("/projects", { params: { teamId } }),
  createProject: (data)            => api.post("/projects", data),
  getProject:    (projectId)       => api.get(`/projects/${projectId}`),
  updateProject: (projectId, data) => api.patch(`/projects/${projectId}`, data),
  deleteProject: (projectId)       => api.delete(`/projects/${projectId}`),
};

// ── Documents ─────────────────────────────────────────────────
export const documentService = {
  getDocuments:   (projectId)       => api.get("/documents", { params: { projectId } }),
  createDocument: (data)            => api.post("/documents", data),
  getDocument:    (docId)           => api.get(`/documents/${docId}`),
  updateDocument: (docId, data)     => api.patch(`/documents/${docId}`, data),
  deleteDocument: (docId)           => api.delete(`/documents/${docId}`),
  saveSnapshot:   (docId, yjsState) => api.post(`/documents/${docId}/snapshot`, { yjsState }),
  getVersions:    (docId)           => api.get(`/documents/${docId}/versions`),
  restoreVersion: (docId, verId)    => api.post(`/documents/${docId}/versions/${verId}/restore`),
};

// ── Whiteboards ───────────────────────────────────────────────
export const whiteboardService = {
  getWhiteboards:   (projectId)      => api.get("/whiteboards", { params: { projectId } }),
  createWhiteboard: (data)           => api.post("/whiteboards", data),
  getWhiteboard:    (wbId)           => api.get(`/whiteboards/${wbId}`),
  updateWhiteboard: (wbId, data)     => api.patch(`/whiteboards/${wbId}`, data),
  deleteWhiteboard: (wbId)           => api.delete(`/whiteboards/${wbId}`),
  saveSnapshot:     (wbId, yjsState) => api.post(`/whiteboards/${wbId}/snapshot`, { yjsState }),
};

// ── Invites ───────────────────────────────────────────────────
export const inviteService = {
  sendInvites:    (data)     => api.post("/invites", data),
  previewInvite:  (token)    => api.get("/invites/preview", { params: { token } }),
  acceptInvite:   (token)    => api.post("/invites/accept", { token }),
  declineInvite:  (token)    => api.post("/invites/decline", { token }),
  getTeamInvites: (teamId)   => api.get(`/invites/team/${teamId}`),
  revokeInvite:   (inviteId) => api.delete(`/invites/${inviteId}`),
};

// ── Comments ──────────────────────────────────────────────────
export const commentService = {
  getComments:    (targetId, targetType) => api.get("/comments", { params: { targetId, targetType } }),
  addComment:     (data)                 => api.post("/comments", data),
  updateComment:  (commentId, content)   => api.patch(`/comments/${commentId}`, { content }),
  deleteComment:  (commentId)            => api.delete(`/comments/${commentId}`),
  resolveComment: (commentId, resolved)  => api.patch(`/comments/${commentId}/resolve`, { resolved }),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationService = {
  getNotifications: ()        => api.get("/notifications"),
  markAsRead:       (notifId) => api.patch(`/notifications/${notifId}/read`),
  markAllAsRead:    ()        => api.patch("/notifications/read-all"),
  deleteNotif:      (notifId) => api.delete(`/notifications/${notifId}`),
};

// ── AI / RAG ──────────────────────────────────────────────────
export const aiService = {
  indexDoc:    (documentId, plainText) => api.post("/ai/index", { documentId, plainText }),
  chat:        (data)                  => api.post("/ai/chat", data),
  summarize:   (plainText)             => api.post("/ai/summarize", { plainText }),
  deleteIndex: (documentId)            => api.delete(`/ai/index/${documentId}`),
};
