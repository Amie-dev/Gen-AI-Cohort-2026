import { SummaryPruner } from "./SummaryPruner.js";

/**
 * AgenticTreeSearchEngine executes Top-Down LLM-style decision tree search traversal.
 * Inspired by AlphaGo Monte Carlo Tree Search (MCTS) & PageIndex Architecture.
 * Supports Google Gemini reasoning and local term scoring fallback.
 */
export class AgenticTreeSearchEngine {
  /**
   * @param {import('../tree/HierarchicalTreeIndex.js').HierarchicalTreeIndex} treeIndex 
   */
  constructor(treeIndex) {
    this.treeIndex = treeIndex;
  }

  /**
   * Evaluates sibling nodes under a parent node to choose the single best branch.
   * Tries Gemini API first, falling back to local term scoring.
   * @param {string} query 
   * @param {import('../tree/TreeNode.js').TreeNode[]} candidateNodes 
   * @returns {Promise<import('../tree/TreeNode.js').TreeNode>}
   */
  async selectBestBranch(query, candidateNodes) {
    const geminiChoice = await SummaryPruner.evaluateWithGemini(query, candidateNodes);
    if (geminiChoice) {
      return geminiChoice;
    }

    let bestNode = candidateNodes[0];
    let maxScore = -1;

    for (const node of candidateNodes) {
      const score = SummaryPruner.calculateRelevanceScore(query, node);
      if (score > maxScore) {
        maxScore = score;
        bestNode = node;
      }
    }

    return bestNode;
  }

  /**
   * Executes top-down agentic tree search from root to leaf node.
   * @param {string} query 
   * @returns {Promise<Object>} Structured retrieval response
   */
  async search(query) {
    let currentNode = this.treeIndex.root;
    const traversalPath = [currentNode.nodeId];
    const reasoningLogs = [];

    console.log(`\n🔍 [Agentic Tree Search Query]: "${query}"`);
    console.log(
      `🚀 Starting Tree Traversal at Root: [${currentNode.nodeId}] ${currentNode.title}`
    );

    // Top-down branch evaluation loop
    while (currentNode.children.length > 0) {
      console.log(
        `\n📂 Evaluating ${currentNode.children.length} child branches under "${currentNode.title}":`
      );

      for (const child of currentNode.children) {
        const score = SummaryPruner.calculateRelevanceScore(query, child);
        console.log(
          `   • [${child.nodeId}] ${child.title} (Score: ${score.toFixed(1)}) -> Summary: ${child.summary.substring(0, 80)}...`
        );
      }

      // Filter branches via SummaryPruner & Gemini reasoning
      const viableBranches = SummaryPruner.pruneNodes(query, currentNode.children);
      const selectedChild =
        viableBranches.length > 0
          ? await this.selectBestBranch(query, viableBranches)
          : await this.selectBestBranch(query, currentNode.children);

      const logMsg = `LLM Agent selected branch [${selectedChild.nodeId}] (${selectedChild.title}) over ${currentNode.children.length - 1} siblings.`;
      reasoningLogs.push(logMsg);

      console.log(
        `🎯 [LLM Agent Selected Branch]: [${selectedChild.nodeId}] ${selectedChild.title}`
      );

      currentNode = selectedChild;
      traversalPath.push(currentNode.nodeId);
    }

    console.log(
      `\n✅ [Target Leaf Node Located]: [${currentNode.nodeId}] ${currentNode.title}`
    );
    console.log(`📍 Explicit Lineage Path: ${traversalPath.join(" -> ")}`);
    console.log(`📖 Page Range: pp. ${currentNode.pageRange.join("-")}`);

    return {
      query,
      documentTitle: this.treeIndex.documentTitle,
      targetNodeId: currentNode.nodeId,
      targetTitle: currentNode.title,
      pageRange: currentNode.pageRange,
      traversalPath,
      reasoningLogs,
      retrievedContent: currentNode.content
    };
  }
}
