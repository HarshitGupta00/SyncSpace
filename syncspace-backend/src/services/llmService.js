// services/llmService.js
// Thin wrapper around Google Gemini API.
// WHY a separate service instead of calling Gemini directly in the controller:
// If you ever switch providers, you change ONE file here — controllers stay untouched.

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/env");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Answer a question using retrieved context chunks (RAG pattern)
const answerWithContext = async (question, contextChunks) => {
  const context = contextChunks.join("\n\n---\n\n");
  // We join chunks with a separator so the model can see where one chunk ends
  // and another begins — helps it not blend unrelated sections together.

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a helpful AI assistant embedded inside a collaborative document editor called SyncSpace.
Answer questions based ONLY on the document context provided below.
If the answer is not in the context, say "I couldn't find that in this document."
Be concise and clear. Format your answer in plain text unless the user asks for formatting.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${question}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3, // lower temperature = more factual, less creative — right for Q&A on documents
      maxOutputTokens: 800,
    },
  });

  return result.response.text();
};

// Summarize an entire document (used for the "Summarize" quick-action button)
// For summarization we send the full text directly — no RAG needed since we
// WANT the whole document, not just relevant chunks.
const summarizeDocument = async (plainText) => {
  // Truncate if extremely long to avoid token limit errors
  const truncated = plainText.slice(0, 30000); // Gemini has a much larger context window than GPT-4o-mini

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Summarize the following document concisely in 3-5 bullet points, then provide a 2-3 sentence overview paragraph.

DOCUMENT:
${truncated}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
    },
  });

  return result.response.text();
};

module.exports = { answerWithContext, summarizeDocument };
