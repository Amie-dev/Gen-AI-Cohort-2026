import { config } from "../config.js";

/**
 * SummaryPruner evaluates high-level node summaries against user query intent to prune irrelevant branches.
 */
export class SummaryPruner {
  /**
   * Scores a candidate tree node summary against user query keywords.
   * @param {string} query 
   * @param {import('../tree/TreeNode.js').TreeNode} node 
   * @returns {number} Semantic relevance score
   */
  static calculateRelevanceScore(query, node) {
    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter((t) => t.length > 2);
    const nodeText = `${node.title} ${node.summary} ${node.keywords.join(" ")} ${node.entities.join(" ")}`.toLowerCase();

    let score = 0;

    for (const term of queryTerms) {
      if (nodeText.includes(term)) {
        score += 2.0;
      }
    }

    // Direct title match boost
    for (const term of queryTerms) {
      if (node.title.toLowerCase().includes(term)) {
        score += 3.0;
      }
    }

    return score;
  }

  /**
   * Filters out candidate nodes falling below threshold score.
   * @param {string} query 
   * @param {import('../tree/TreeNode.js').TreeNode[]} candidateNodes 
   * @param {number} [threshold=config.pruningThreshold]
   * @returns {import('../tree/TreeNode.js').TreeNode[]}
   */
  static pruneNodes(query, candidateNodes, threshold = config.pruningThreshold) {
    return candidateNodes.filter((node) => {
      const score = SummaryPruner.calculateRelevanceScore(query, node);
      return score >= threshold;
    });
  }
}
