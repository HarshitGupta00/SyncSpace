// controllers/documentController.js

const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Project = require("../models/Project");
const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Helper: verify user has access to a project (and return the project)
const getProjectWithAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) return { error: "Project not found", status: 404 };

  if (project.team) {
    const membership = await TeamMember.findOne({ user: userId, team: project.team });
    if (!membership) return { error: "Access denied", status: 403 };
    return { project, role: membership.role };
  } else {
    if (project.owner.toString() !== userId.toString()) {
      return { error: "Access denied", status: 403 };
    }
    return { project, role: "owner" };
  }
};

// @desc    Create a document inside a project
// @route   POST /api/documents
// @access  Protected
exports.createDocument = asyncHandler(async (req, res) => {
  const { title, projectId } = req.body;

  const { error, status } = await getProjectWithAccess(projectId, req.user._id);
  if (error) return sendError(res, error, status);

  const document = await Document.create({
    title: title || "Untitled Document",
    project: projectId,
    owner: req.user._id,
  });

  return sendSuccess(res, { document }, "Document created", 201);
});

// @desc    Get all documents in a project
// @route   GET /api/documents?projectId=xxx
// @access  Protected
exports.getDocuments = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return sendError(res, "projectId is required", 400);

  const { error, status } = await getProjectWithAccess(projectId, req.user._id);
  if (error) return sendError(res, error, status);

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
// @access  Protected
exports.getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId)
    .populate("owner", "name avatar")
    .populate("lastEditedBy", "name avatar")
    .select("-yjsState") // Yjs binary content loaded separately via websocket, not REST
    .lean();

  if (!document) return sendError(res, "Document not found", 404);

  const { error, status } = await getProjectWithAccess(document.project, req.user._id);
  if (error) return sendError(res, error, status);

  return sendSuccess(res, { document });
});

// @desc    Update document metadata (title, description, tags, properties)
// @route   PATCH /api/documents/:docId
// @access  Protected
exports.updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId);
  if (!document) return sendError(res, "Document not found", 404);

  const { error, status } = await getProjectWithAccess(document.project, req.user._id);
  if (error) return sendError(res, error, status);

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
exports.deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId);
  if (!document) return sendError(res, "Document not found", 404);

  if (document.owner.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the document owner can delete it", 403);
  }

  await Document.findByIdAndDelete(req.params.docId);
  // Also delete all version history for this document
  await DocumentVersion.deleteMany({ document: req.params.docId });

  return sendSuccess(res, {}, "Document deleted");
});

// @desc    Save a Yjs snapshot (called by Yjs persistence layer, not directly by user)
// @route   POST /api/documents/:docId/snapshot
// @access  Protected
exports.saveSnapshot = asyncHandler(async (req, res) => {
  const { yjsState } = req.body;
  // yjsState comes in as a base64 string (binary can't reliably travel as JSON)
  // We convert back to Buffer before storing
  const buffer = Buffer.from(yjsState, "base64");

  await Document.findByIdAndUpdate(req.params.docId, {
    yjsState: buffer,
    lastEditedBy: req.user._id,
  });

  // Save a version history snapshot
  await DocumentVersion.create({
    document: req.params.docId,
    yjsState: buffer,
    savedBy: req.user._id,
  });

  return sendSuccess(res, {}, "Snapshot saved");
});

// @desc    Get version history for a document
// @route   GET /api/documents/:docId/versions
// @access  Protected
exports.getVersions = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId).lean();
  if (!document) return sendError(res, "Document not found", 404);

  const { error, status } = await getProjectWithAccess(document.project, req.user._id);
  if (error) return sendError(res, error, status);

  const versions = await DocumentVersion.find({ document: req.params.docId })
    .populate("savedBy", "name avatar")
    .select("-yjsState") // don't send binary blobs in the list — only fetch on explicit restore
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { versions });
});

// @desc    Restore a specific version
// @route   POST /api/documents/:docId/versions/:versionId/restore
// @access  Protected
exports.restoreVersion = asyncHandler(async (req, res) => {
  const version = await DocumentVersion.findById(req.params.versionId);
  if (!version) return sendError(res, "Version not found", 404);

  // Overwrite the document's current yjsState with the chosen version's state
  await Document.findByIdAndUpdate(req.params.docId, {
    yjsState: version.yjsState,
    lastEditedBy: req.user._id,
  });

  // Return the binary state as base64 so the frontend Yjs instance can reload it
  return sendSuccess(res, {
    yjsState: version.yjsState.toString("base64"),
  }, "Version restored");
  // NOTE: after this response, the frontend will reload the Yjs document
  // from this state and broadcast the change to all other connected clients
  // via the existing Yjs websocket channel.
});
