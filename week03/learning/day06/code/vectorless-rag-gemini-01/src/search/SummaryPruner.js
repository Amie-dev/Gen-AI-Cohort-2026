import { config } from "../config.js";
import { callGemini } from "./geminiClient.js";

/**
 * SummaryPruner evaluates high-level node summaries against user query intent to prune irrelevant branches.
 * Supports Google Gemini API evaluation with local keyword fallback.
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
   * Uses Google Gemini API to evaluate candidate branch nodes and select the best matching node.
   * @param {string} query 
   * @param {import('../tree/TreeNode.js').TreeNode[]} candidateNodes 
   * @returns {Promise<import('../tree/TreeNode.js').TreeNode|null>}
   */
  static async evaluateWithGemini(query, candidateNodes) {
    const candidatesText = candidateNodes.map((n, i) => `Option ${i + 1} [ID: ${n.nodeId}]: ${n.title}\nSummary: ${n.summary}\nKeywords: ${n.keywords.join(", ")}`).join("\n\n");

    const systemInstruction = "You are an expert AI retrieval agent navigating a hierarchical document index. Evaluate candidate options and respond ONLY with a JSON object format: {\"selectedNodeId\": \"<node_id>\", \"reasoning\": \"<short_explanation>\"}.";
    const prompt = `User Query: "${query}"\n\nCandidate Document Branches:\n${candidatesText}`;

    const rawResponse = await callGemini({ systemInstruction, prompt });
    if (rawResponse) {
      try {
        const cleaned = rawResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const selected = candidateNodes.find((n) => n.nodeId === parsed.selectedNodeId);
        if (selected) {
          console.log(`✨ [Gemini Reasoning Agent]: Selected [${selected.nodeId}] -> Reason: ${parsed.reasoning}`);
          return selected;
        }
      } catch (err) {
        // Fallback to local scoring if JSON parsing fails
      }
    }
    return null;
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
