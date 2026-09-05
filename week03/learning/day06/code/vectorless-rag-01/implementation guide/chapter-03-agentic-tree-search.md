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

```javascript
import { config } from "../config.js";

export class SummaryPruner {
  static evaluateRelevance(query, node) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const nodeText = `${node.title} ${node.summary}`.toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      if (nodeText.includes(term)) {
        score += 1.0;
      }
    }

    // Boost score if title matches keywords directly
    for (const term of queryTerms) {
      if (node.title.toLowerCase().includes(term)) {
        score += 1.5;
      }
    }

    return score;
  }

  static pruneBranches(query, nodes, threshold = config.pruningThreshold) {
    const scoredNodes = nodes.map((node) => ({
      node,
      score: SummaryPruner.evaluateRelevance(query, node)
    }));

    scoredNodes.sort((a, b) => b.score - a.score);

    // Keep nodes meeting threshold, or at least the top candidate if any score > 0
    const relevant = scoredNodes.filter((sn) => sn.score >= threshold);
    if (relevant.length === 0 && scoredNodes.length > 0 && scoredNodes[0].score > 0) {
      return [scoredNodes[0].node];
    }

    return relevant.map((sn) => sn.node);
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

export class AgenticTreeSearchEngine {
  constructor(treeIndex) {
    this.index = treeIndex;
  }

  search(query, maxDepth = 3) {
    console.log(`\n🔍 [Agentic Tree Search] Query: "${query}"`);
    const logs = [];
    const matchedLeaves = [];

    if (!this.index || !this.index.root) {
      return { matchedLeaves, logs, error: "Empty or invalid tree index." };
    }

    let currentCandidates = [this.index.root];
    let depth = 0;

    while (currentCandidates.length > 0 && depth < maxDepth) {
      depth++;
      console.log(`   ├─ Level ${depth}: Evaluating ${currentCandidates.length} candidate node(s)...`);

      const nextLevelCandidates = [];

      for (const candidate of currentCandidates) {
        logs.push({
          depth,
          nodeId: candidate.id,
          title: candidate.title,
          action: "evaluating"
        });

        if (candidate.isLeaf()) {
          matchedLeaves.push(candidate);
          console.log(`   │  └─ 🎯 Found Leaf Match: "${candidate.title}" (Pages ${candidate.pageStart}-${candidate.pageEnd})`);
        } else {
          // Prune children of current container node
          const prunedChildren = SummaryPruner.pruneBranches(query, candidate.children);
          console.log(`   │  └─ Node "${candidate.title}": Pruned ${candidate.children.length - prunedChildren.length}/${candidate.children.length} sub-branches.`);

          for (const child of prunedChildren) {
            nextLevelCandidates.push(child);
          }
        }
      }

      currentCandidates = nextLevelCandidates;
    }

    // Collect content chunks from matched leaves
    const retrievedChunks = [];
    for (const leaf of matchedLeaves) {
      retrievedChunks.push({
        title: leaf.title,
        pageStart: leaf.pageStart,
        pageEnd: leaf.pageEnd,
        chunks: leaf.chunks
      });
    }

    return {
      query,
      matchedLeavesCount: matchedLeaves.length,
      retrievedChunks,
      trajectoryLogs: logs
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
