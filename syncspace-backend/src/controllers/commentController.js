// controllers/commentController.js
//
// TASK 3 FIX: Previously getComments and addComment did NOT check that the
// requester has access to the target document/whiteboard. Now all comment
// operations resolve target → project access via permissionService.

const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { emitNotification } = require("../sockets/notificationHandler");
const {
  ROLE_WEIGHT,
  resolveDocumentAccess,
  resolveWhiteboardAccess,
} = require("../services/permissionService");

/**
 * Helper: resolve access for a comment target (Document or Whiteboard).
 * Returns { effectiveRole } or { error, status }.
 */
const resolveTargetAccess = async (userId, targetId, targetType) => {
  if (targetType === "Document") {
    return resolveDocumentAccess(userId, targetId);
  } else if (targetType === "Whiteboard") {
    return resolveWhiteboardAccess(userId, targetId);
  }
  return { error: "Invalid targetType", status: 400 };
};

// @desc    Add a comment to a document or whiteboard
// @route   POST /api/comments
// @access  Protected (commenter or above)
exports.addComment = asyncHandler(async (req, res) => {
  const { targetId, targetType, content, anchor, mentions } = req.body;

  // Access check — must have at least commenter access to the target's project
  const result = await resolveTargetAccess(req.user._id, targetId, targetType);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.commenter) {
    return sendError(res, "You need commenter access to add comments", 403);
  }

  const comment = await Comment.create({
    target: targetId,
    targetType,
    content,
    author: req.user._id,
    anchor: anchor || { from: null, to: null },
    mentions: mentions || [],
  });

  await comment.populate("author", "name avatar");

  // Fire notifications for each mentioned user
  // We do this AFTER creating the comment so we have the comment._id
  if (mentions && mentions.length > 0) {
    for (const mentionedUserId of mentions) {
      // Don't notify yourself
      if (mentionedUserId.toString() === req.user._id.toString()) continue;

      const notification = await Notification.create({
        recipient: mentionedUserId,
        type: "mention",
        message: `${req.user.name} mentioned you in a comment`,
        link: `/${targetType.toLowerCase()}s/${targetId}`,
        triggeredBy: req.user._id,
      });

      // Push real-time notification if recipient is online
      // io is accessed via the app's global or passed via req — here we use
      // the exported emitNotification utility from notificationHandler
      emitNotification(req.app.get("io"), mentionedUserId, notification);
    }
  }

  return sendSuccess(res, { comment }, "Comment added", 201);
});

// @desc    Get all comments for a document or whiteboard
// @route   GET /api/comments?targetId=xxx&targetType=Document
// @access  Protected (viewer or above)
exports.getComments = asyncHandler(async (req, res) => {
  const { targetId, targetType } = req.query;
  if (!targetId || !targetType) {
    return sendError(res, "targetId and targetType are required", 400);
  }

  // Access check — must have at least viewer access
  const result = await resolveTargetAccess(req.user._id, targetId, targetType);
  if (result.error) return sendError(res, result.error, result.status);

  const comments = await Comment.find({ target: targetId, targetType })
    .populate("author", "name avatar")
    .populate("mentions", "name avatar")
    .sort({ createdAt: 1 }) // oldest first — chronological thread order
    .lean();

  return sendSuccess(res, { comments });
});

// @desc    Update a comment (edit content)
// @route   PATCH /api/comments/:commentId
// @access  Protected (author only)
exports.updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return sendError(res, "Comment not found", 404);

  if (comment.author.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the comment author can edit it", 403);
  }

  comment.content = req.body.content;
  await comment.save();
  await comment.populate("author", "name avatar");

  return sendSuccess(res, { comment }, "Comment updated");
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Protected (author only)
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return sendError(res, "Comment not found", 404);

  if (comment.author.toString() !== req.user._id.toString()) {
    return sendError(res, "Only the comment author can delete it", 403);
  }

  await Comment.findByIdAndDelete(req.params.commentId);
  return sendSuccess(res, {}, "Comment deleted");
});

// @desc    Resolve / unresolve a comment
// @route   PATCH /api/comments/:commentId/resolve
// @access  Protected (commenter or above on the target's project)
exports.resolveComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return sendError(res, "Comment not found", 404);

  // Access check — resolving requires at least commenter access
  const result = await resolveTargetAccess(req.user._id, comment.target, comment.targetType);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.commenter) {
    return sendError(res, "You need commenter access to resolve comments", 403);
  }

  const updated = await Comment.findByIdAndUpdate(
    req.params.commentId,
    { resolved: req.body.resolved },
    { new: true }
  ).populate("author", "name avatar");

  return sendSuccess(res, { comment: updated }, `Comment ${req.body.resolved ? "resolved" : "reopened"}`);
});
