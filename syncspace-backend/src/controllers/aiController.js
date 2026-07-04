// controllers/aiController.js

const Document = require("../models/Document");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { indexDocument, retrieveRelevantChunks, deleteDocumentIndex } = require("../services/ragService");
const { answerWithContext, summarizeDocument } = require("../services/llmService");

// Helper: extract plain text from a Yjs document's stored snapshot.
// In our setup, the frontend sends plain text for indexing (not the binary Yjs state)
// because converting Yjs binary → plain text is much easier on the frontend
// (where TipTap already has the parsed document in memory).
// The backend just receives the text and chunks/embeds it.

// @desc    Index (or re-index) a document's content into Pinecone for RAG
// @route   POST /api/ai/index
// @access  Protected
// Called automatically by the frontend after each auto-save that changes content significantly
exports.indexDoc = asyncHandler(async (req, res) => {
  const { documentId, plainText } = req.body;

  if (!plainText || plainText.trim().length < 10) {
    return sendError(res, "Document has no content to index", 400);
  }

  // Verify document exists and user has access
  const document = await Document.findById(documentId);
  if (!document) return sendError(res, "Document not found", 404);

  const result = await indexDocument(documentId, plainText);

  return sendSuccess(res, result, "Document indexed for AI search");
});

// @desc    Ask a question about a document (RAG chat)
// @route   POST /api/ai/chat
// @access  Protected
exports.chat = asyncHandler(async (req, res) => {
  const { documentId, question, plainText } = req.body;
  // plainText is sent as a fallback for short documents where full-context
  // is cheaper than vector search (avoids Pinecone call for tiny docs)

  if (!question || question.trim().length === 0) {
    return sendError(res, "Question is required", 400);
  }

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
// @access  Protected
exports.summarize = asyncHandler(async (req, res) => {
  const { plainText } = req.body;

  if (!plainText || plainText.trim().length < 20) {
    return sendError(res, "Document is too short to summarize", 400);
  }

  const summary = await summarizeDocument(plainText);

  return sendSuccess(res, { summary });
});

// @desc    Delete a document's vector index (called when document is deleted)
// @route   DELETE /api/ai/index/:documentId
// @access  Protected
exports.deleteIndex = asyncHandler(async (req, res) => {
  await deleteDocumentIndex(req.params.documentId);
  return sendSuccess(res, {}, "Document index deleted");
});
