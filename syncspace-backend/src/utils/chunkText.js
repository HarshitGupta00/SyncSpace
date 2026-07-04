// utils/chunkText.js
// Splits a long document into smaller overlapping chunks for RAG.
//
// WHY chunk instead of sending the whole document to the LLM:
// LLMs have a context window limit (e.g. GPT-4o = ~128k tokens).
// A large document can exceed this. More importantly, sending EVERYTHING
// is expensive and slower — RAG lets us send only the RELEVANT parts.
//
// WHY overlap (chunkOverlap):
// If a sentence is split across two chunks, meaning is lost in both.
// Overlapping ensures context isn't cut at a chunk boundary.
// e.g. chunk 1 = words 0-500, chunk 2 = words 400-900 (100-word overlap)

const chunkText = (text, chunkSize = 500, chunkOverlap = 100) => {
  const words = text.split(/\s+/); // split by whitespace
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");
    chunks.push(chunk);

    // Move forward by (chunkSize - overlap) so next chunk shares `overlap` words
    start += chunkSize - chunkOverlap;

    // Safety: if overlap >= chunkSize we'd loop forever
    if (chunkSize <= chunkOverlap) break;
  }

  return chunks.filter((c) => c.trim().length > 0);
};

module.exports = chunkText;
