// services/llmService.js
// Thin wrapper around OpenAI Chat API.
// WHY a separate service instead of calling openai directly in the controller:
// If you ever switch from OpenAI to Gemini or another provider, you change
// ONE file here — controllers stay untouched.

const OpenAI = require("openai/index.mjs");
const { OPENAI_API_KEY } = require("../config/env");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Answer a question using retrieved context chunks (RAG pattern)
const answerWithContext = async (question, contextChunks) => {
  const context = contextChunks.join("\n\n---\n\n");
  // We join chunks with a separator so the model can see where one chunk ends
  // and another begins — helps it not blend unrelated sections together.

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // cheaper than gpt-4o, still very capable for Q&A on text
    messages: [
      {
        role: "system",
        content: `You are a helpful AI assistant embedded inside a collaborative document editor called SyncSpace.
Answer questions based ONLY on the document context provided below.
If the answer is not in the context, say "I couldn't find that in this document."
Be concise and clear. Format your answer in plain text unless the user asks for formatting.

DOCUMENT CONTEXT:
${context}`,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0.3, // lower temperature = more factual, less creative — right for Q&A on documents
    max_tokens: 800,
  });

  return response.choices[0].message.content;
};

// Summarize an entire document (used for the "Summarize" quick-action button)
// For summarization we send the full text directly — no RAG needed since we
// WANT the whole document, not just relevant chunks.
const summarizeDocument = async (plainText) => {
  // Truncate if extremely long to avoid token limit errors
  const truncated = plainText.slice(0, 12000); // ~3000 tokens — safe for gpt-4o-mini

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Summarize the following document concisely in 3-5 bullet points, then provide a 2-3 sentence overview paragraph.",
      },
      {
        role: "user",
        content: truncated,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
};

module.exports = { answerWithContext, summarizeDocument };
