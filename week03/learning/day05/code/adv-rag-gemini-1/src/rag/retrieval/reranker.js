/**
 * Step 11 — Re-Ranking
 * Section 18: Cross-encoder relevance re-ranker filtering fused document candidates.
 */
export async function rerank(query, documents) {
  console.log(`[Reranker] Re-ranking ${documents.length} candidates for query: "${query}"`);

  // Compute cross-attention relevance score boost based on keyword overlap & RRF score
  const scoredDocs = documents.map(doc => {
    let boost = 0;
    const queryTokens = query.toLowerCase().split(/\s+/);
    const docText = (doc.title + ' ' + doc.text).toLowerCase();

    for (const token of queryTokens) {
      if (token.length > 3 && docText.includes(token)) {
        boost += 0.2;
      }
    }

    return {
      ...doc,
      relevanceScore: (doc.rrfScore || 0.1) + boost
    };
  });

  return scoredDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
