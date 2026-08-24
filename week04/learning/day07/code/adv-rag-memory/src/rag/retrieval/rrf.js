import { config } from "../../config.js";

/**
 * Reciprocal Rank Fusion (RRF) Engine
 * Fuses documents retrieved from multiple streams (Rewrite, Step-Back, Sub-Queries, HyDE, and Adapters).
 * Formula: RRF(d) = \sum_{m \in M} 1 / (k + r_m(d)) where k = 60.
 */
export class ReciprocalRankFusion {
  static fuse(searchLists, rrfK = config.rag.rrfK, topK = config.rag.topK) {
    const scoreMap = new Map(); // docId -> { doc, score }

    searchLists.forEach((stream) => {
      stream.forEach((doc, idx) => {
        const rank = idx + 1;
        const contribution = 1 / (rrfK + rank);

        if (!scoreMap.has(doc.id)) {
          scoreMap.set(doc.id, { doc, score: contribution });
        } else {
          scoreMap.get(doc.id).score += contribution;
        }
      });
    });

    const fused = Array.from(scoreMap.values());
    fused.sort((a, b) => b.score - a.score);

    return fused.slice(0, topK).map((item) => ({
      ...item.doc,
      rrfScore: item.score,
    }));
  }
}
