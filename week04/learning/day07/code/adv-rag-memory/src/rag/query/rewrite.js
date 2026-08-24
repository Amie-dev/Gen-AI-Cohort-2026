/**
 * Query Rewriter
 * Normalizes user queries into clean, keyword-dense search strings.
 */
export class QueryRewriter {
  static rewrite(query) {
    const cleaned = query
      .replace(/(please|can you|tell me|i want to know|what is|how to)/gi, "")
      .trim();
    return cleaned.length > 0 ? `${cleaned} technical specification` : query;
  }
}
