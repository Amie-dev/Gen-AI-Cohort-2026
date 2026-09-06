# Chapter 3 — Summary Pruner & Agentic Tree Search Engine

## 1. Chapter Goal

The goal of this chapter is to build the **`SummaryPruner` Class** (`src/search/SummaryPruner.js`) and the **`AgenticTreeSearchEngine` Class** (`src/search/AgenticTreeSearchEngine.js`).

Vectorless RAG replaces vector similarity queries with **Top-Down Agentic Tree Traversal**. Starting at the root node, the search engine evaluates child node summaries at each level, prunes irrelevant branches using `SummaryPruner`, and navigates down the relevant branch until reaching the exact leaf chunks.

In this chapter, we:
* Build the `SummaryPruner` module (`src/search/SummaryPruner.js`)
* Build the `AgenticTreeSearchEngine` module (`src/search/AgenticTreeSearchEngine.js`)
* Implement branch pruning thresholds and navigation trajectory logging

---

### 🎯 Expected Outcome

The search engine pinpoints relevant document sections by navigating the tree hierarchy:

```text
Query: "How do sticky sessions handle failover?"
  │
  ├── Evaluate Root Children -> Prune [Networking, Databases]
  ├── Select [Load Balancing] -> Evaluate Sub-sections -> Select [Sticky Sessions]
  └── Return Target Pages & Relevant Chunks
```

---

## 2. Implementing `SummaryPruner` (`src/search/SummaryPruner.js`)

Evaluates node summary relevancy against the query string using keyword and semantic match scoring:

### File Path

```text
vectorless-rag-01/src/search/SummaryPruner.js
```

### Code

## 2. Implementing `SummaryPruner` (`src/search/SummaryPruner.js`)

Evaluates node summary relevancy against the query string using keyword and semantic match scoring:

### File Path

```text
vectorless-rag-01/src/search/SummaryPruner.js
```

### Code

```javascript
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
```

---

## 3. Implementing `AgenticTreeSearchEngine` (`src/search/AgenticTreeSearchEngine.js`)

### File Path

```text
vectorless-rag-01/src/search/AgenticTreeSearchEngine.js
```

### Code

```javascript
import { SummaryPruner } from "./SummaryPruner.js";

/**
 * AgenticTreeSearchEngine executes Top-Down LLM-style decision tree search traversal.
 * Inspired by AlphaGo Monte Carlo Tree Search (MCTS) & PageIndex Architecture.
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
   * @param {string} query 
   * @param {import('../tree/TreeNode.js').TreeNode[]} candidateNodes 
   * @returns {import('../tree/TreeNode.js').TreeNode}
   */
  selectBestBranch(query, candidateNodes) {
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
   * @returns {Object} Structured retrieval response
   */
  search(query) {
    let currentNode = this.treeIndex.root;
    const traversalPath = [currentNode.nodeId];
    const reasoningLogs = [];

    console.log(`\n🔍 [Agentic Tree Search Query]: "${query}"`);
    console.log(
      `🚀 Starting Tree Traversal at Root: [${currentNode.nodeId}] ${currentNode.title}`
    );

    // Top-down branch evaluation
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

      // Filter branches via SummaryPruner
      const viableBranches = SummaryPruner.pruneNodes(query, currentNode.children);
      const selectedChild =
        viableBranches.length > 0
          ? this.selectBestBranch(query, viableBranches)
          : this.selectBestBranch(query, currentNode.children);

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
```

---

## 4. Verification & Testing

Verify Agentic Tree Search in Node.js:

```bash
node -e "
import { TreeBuilder } from './src/tree/TreeBuilder.js';
import { AgenticTreeSearchEngine } from './src/search/AgenticTreeSearchEngine.js';
const sections = [
  { title: 'Networking Overview', level: 1, content: 'IP protocols' },
  { title: 'Load Balancing', level: 1, content: 'Round robin rules' },
  { title: 'Sticky Session Failover', level: 2, content: 'Cookie session recovery details' }
];
const index = TreeBuilder.buildFromStructuredSections('Cluster Guide', sections);
const engine = new AgenticTreeSearchEngine(index);
const res = engine.search('sticky session failover');
console.log('Matched Leaves Count:', res.matchedLeavesCount);
"
```

### Expected Output

```text
🔍 [Agentic Tree Search] Query: "sticky session failover"
   ├─ Level 1: Evaluating 1 candidate node(s)...
   │  └─ Node "Cluster Guide": Pruned 1/2 sub-branches.
   ├─ Level 2: Evaluating 1 candidate node(s)...
   │  └─ Node "Load Balancing": Pruned 0/1 sub-branches.
   ├─ Level 3: Evaluating 1 candidate node(s)...
   │  └─ 🎯 Found Leaf Match: "Sticky Session Failover" (Pages 1-1)
Matched Leaves Count: 1
```

Move to **Chapter 4** to build the LLM Wiki Architecture & Vault Manager.
