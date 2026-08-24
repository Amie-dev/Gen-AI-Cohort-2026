/**
 * Infrastructure Connector: Qdrant Vector DB Layer
 * In-memory fallback and mock implementation of Qdrant Client.
 */
export class QdrantConnector {
  constructor() {
    this.collection = [];
  }

  async upsert(points) {
    this.collection.push(...points);
    return { status: "completed" };
  }

  async search(vector, topK = 5) {
    // Simple similarity match based on vector dot product
    const scored = this.collection.map((pt) => {
      let sim = 0;
      if (pt.vector && vector && pt.vector.length === vector.length) {
        sim = pt.vector.reduce((sum, v, i) => sum + v * vector[i], 0);
      }
      return { ...pt, score: sim };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const qdrantClient = new QdrantConnector();
