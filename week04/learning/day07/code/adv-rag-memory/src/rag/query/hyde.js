/**
 * HyDE (Hypothetical Document Embeddings) Generator
 * Generates synthetic hypothetical passage to improve dense vector retrieval matching.
 */
export class HyDEGenerator {
  static generatePassage(query) {
    return `Technical Documentation passage addressing "${query}": Key details include system design, database indexing, vector similarity, and production optimization patterns.`;
  }
}
