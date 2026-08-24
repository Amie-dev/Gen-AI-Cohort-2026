/**
 * HybridRanker.js
 * Implements Reciprocal Rank Fusion (RRF) and Re-ranking over multiple search result streams.
 */
export class HybridRanker {
  /**
   * Reciprocal Rank Fusion (RRF)
   * @param {Array<Array<Object>>} searchLists - Array of ranked document lists
   * @param {number} rrfK - Rank constant (default 60)
   * @param {number} finalTopK - Number of top documents to return
   */
  static fuseRRF(searchLists, rrfK = 60, finalTopK = 4) {
    const scoresMap = new Map(); // chunkId -> { chunk, rrfScore }

    searchLists.forEach((docList) => {
      docList.forEach((doc, rankIndex) => {
        const rank = rankIndex + 1; // 1-based rank
        const contribution = 1 / (rrfK + rank);

        if (!scoresMap.has(doc.id)) {
          scoresMap.set(doc.id, {
            chunk: doc,
            rrfScore: contribution,
          });
        } else {
          const item = scoresMap.get(doc.id);
          item.rrfScore += contribution;
        }
      });
    });

    const fused = Array.from(scoresMap.values());
    fused.sort((a, b) => b.rrfScore - a.rrfScore);

    return fused.slice(0, finalTopK).map((item) => ({
      ...item.chunk,
      finalScore: item.rrfScore,
    }));
  }
}
