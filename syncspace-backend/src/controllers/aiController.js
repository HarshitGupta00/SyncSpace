// controllers/aiController.js
//
// TASK 3 FIX: Previously none of these endpoints verified that the requester
// had access to the documentId in the request. Now all four endpoints resolve
// document → project access via permissionService before hitting Pinecone/OpenAI.

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { indexDocument, retrieveRelevantChunks, deleteDocumentIndex } = require("../services/ragService");
const { answerWithContext, summarizeDocument } = require("../services/llmService");
const {
  ROLE_WEIGHT,
  resolveDocumentAccess,
} = require("../services/permissionService");

// Helper: extract plain text from a Yjs document's stored snapshot.
// In our setup, the frontend sends plain text for indexing (not the binary Yjs state)
// because converting Yjs binary → plain text is much easier on the frontend
// (where TipTap already has the parsed document in memory).
// The backend just receives the text and chunks/embeds it.

// @desc    Index (or re-index) a document's content into Pinecone for RAG
// @route   POST /api/ai/index
// @access  Protected (editor or above — indexing modifies the search layer)
// Called automatically by the frontend after each auto-save that changes content significantly
exports.indexDoc = asyncHandler(async (req, res) => {
  const { documentId, plainText } = req.body;

  if (!plainText || plainText.trim().length < 10) {
    return sendError(res, "Document has no content to index", 400);
  }

  // Access check — indexing requires editor access
  const result = await resolveDocumentAccess(req.user._id, documentId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to index documents", 403);
  }

  const indexResult = await indexDocument(documentId, plainText);

  return sendSuccess(res, indexResult, "Document indexed for AI search");
});

// @desc    Ask a question about a document (RAG chat)
// @route   POST /api/ai/chat
// @access  Protected (viewer or above — reading the doc is enough to ask questions)
exports.chat = asyncHandler(async (req, res) => {
  const { documentId, question, plainText } = req.body;
  // plainText is sent as a fallback for short documents where full-context
  // is cheaper than vector search (avoids Pinecone call for tiny docs)

  if (!question || question.trim().length === 0) {
    return sendError(res, "Question is required", 400);
  }

  // Access check — chatting requires at least viewer access
  const result = await resolveDocumentAccess(req.user._id, documentId);
  if (result.error) return sendError(res, result.error, result.status);

  let contextChunks;

  // For short documents (< 1500 words), skip vector search entirely —
  // just use the full text as context. Faster and cheaper.
  // For longer documents, use RAG (retrieve only the most relevant chunks).
  const wordCount = plainText ? plainText.split(/\s+/).length : 9999;

  if (plainText && wordCount < 1500) {
    // Short doc: use full text directly, no retrieval step needed
    contextChunks = [plainText];
  } else {
    // Long doc: retrieve top 5 most relevant chunks from Pinecone
    contextChunks = await retrieveRelevantChunks(documentId, question, 5);

    if (contextChunks.length === 0) {
      return sendError(res, "Document hasn't been indexed yet. Please try again in a moment.", 404);
    }
  }

  const answer = await answerWithContext(question, contextChunks);

  return sendSuccess(res, { answer, question });
});

// @desc    Summarize entire document (quick-action button in AI panel)
// @route   POST /api/ai/summarize
// @access  Protected (viewer or above)
exports.summarize = asyncHandler(async (req, res) => {
  const { documentId, plainText } = req.body;

  if (!plainText || plainText.trim().length < 20) {
    return sendError(res, "Document is too short to summarize", 400);
  }

  // Access check — summarizing requires at least viewer access
  if (documentId) {
    const result = await resolveDocumentAccess(req.user._id, documentId);
    if (result.error) return sendError(res, result.error, result.status);
  }

  const summary = await summarizeDocument(plainText);

  return sendSuccess(res, { summary });
});

// @desc    Delete a document's vector index (called when document is deleted)
// @route   DELETE /api/ai/index/:documentId
// @access  Protected (editor or above)
exports.deleteIndex = asyncHandler(async (req, res) => {
  // Access check — deleting the index requires editor access
  const result = await resolveDocumentAccess(req.user._id, req.params.documentId);
  if (result.error) return sendError(res, result.error, result.status);

  if (ROLE_WEIGHT[result.effectiveRole] < ROLE_WEIGHT.editor) {
    return sendError(res, "You need editor access to delete the index", 403);
  }

  await deleteDocumentIndex(req.params.documentId);
  return sendSuccess(res, {}, "Document index deleted");
});
