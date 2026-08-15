import { config } from "../config.js";

/**
 * Step 10: Reciprocal Rank Fusion (RRF)
 * Combines multiple ranked result lists into a single unified ranking.
 * Formula: RRF(d) = sum( 1 / (k + rank) )
 */
export function reciprocalRankFusion(rankedLists, k = config.retrieval.rrfK) {
  const scores = new Map();

  for (const list of rankedLists) {
    if (!Array.isArray(list)) continue;
    list.forEach((doc, index) => {
      const rank = index + 1; // 1-based rank
      const contribution = 1 / (k + rank);

      if (!scores.has(doc.id)) {
        scores.set(doc.id, {
          ...doc,
          rrfScore: contribution,
          appearanceCount: 1,
        });
      } else {
        const existing = scores.get(doc.id);
        existing.rrfScore += contribution;
        existing.appearanceCount += 1;
      }
    });
  }

  return [...scores.values()].sort((a, b) => b.rrfScore - a.rrfScore);
}
