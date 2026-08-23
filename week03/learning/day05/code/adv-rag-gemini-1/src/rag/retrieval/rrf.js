/**
 * Step 10 — Reciprocal Rank Fusion (RRF)
 * Section 17: Fuses multiple ranked lists of documents into a single scored ranking list.
 * Formula: RRF(d) = sum( 1 / (k + rank) ) with k = 60
 */
export function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();

  for (const list of lists) {
    list.forEach((doc, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);

      if (!scores.has(doc.id)) {
        scores.set(doc.id, {
          ...doc,
          rrfScore: 0
        });
      }

      scores.get(doc.id).rrfScore += score;
    });
  }

  return [...scores.values()].sort((a, b) => b.rrfScore - a.rrfScore);
}
