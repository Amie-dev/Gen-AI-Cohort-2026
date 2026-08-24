import { getEmbedding, cosineSimilarity } from "../utils/embeddings.js";

/**
 * DocumentStore.js
 * In-Memory Vector & Keyword Document Collection for Knowledge Retrieval
 */
export class DocumentStore {
  constructor() {
    this.chunks = []; // Array of { id, docId, title, content, vector, keywords }
  }

  /**
   * Add raw text content to knowledge base, chunking and embedding it
   */
  async addDocument(docId, title, content, chunkSize = 200, overlap = 50) {
    const words = content.split(/\s+/);
    let start = 0;
    let chunkIndex = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkText = words.slice(start, end).join(" ");
      const vector = await getEmbedding(chunkText);
      const keywords = new Set(chunkText.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/));

      this.chunks.push({
        id: `${docId}_chunk_${chunkIndex}`,
        docId,
        title,
        content: chunkText,
        vector,
        keywords,
      });

      chunkIndex++;
      start += chunkSize - overlap;
    }
  }

  /**
   * Perform dense vector similarity search
   */
  async searchDense(vector, topK = 5) {
    const scored = this.chunks.map((chunk) => {
      const sim = cosineSimilarity(vector, chunk.vector);
      return { ...chunk, score: sim, searchType: "dense" };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Perform sparse keyword match search
   */
  async searchSparse(query, topK = 5) {
    const queryTokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    
    const scored = this.chunks.map((chunk) => {
      let matches = 0;
      queryTokens.forEach((token) => {
        if (chunk.keywords.has(token)) matches++;
      });
      const score = matches / (queryTokens.length || 1);
      return { ...chunk, score, searchType: "sparse" };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
