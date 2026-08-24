/**
 * Re-Ranker Engine
 * Applies fine-grained semantic relevance scoring over top RRF candidates.
 */
export class SemanticReRanker {
  static reRank(query, candidateDocs) {
    const qLower = query.toLowerCase();

    const scored = candidateDocs.map((doc) => {
      let boost = 0;
      if (doc.title && doc.title.toLowerCase().includes(qLower)) boost += 0.3;
      if (doc.content && doc.content.toLowerCase().includes(qLower)) boost += 0.5;

      return {
        ...doc,
        reRankScore: (doc.rrfScore || 0.1) + boost,
      };
    });

    scored.sort((a, b) => b.reRankScore - a.reRankScore);
    return scored;
  }
}
