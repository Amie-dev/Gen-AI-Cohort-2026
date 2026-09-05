# Chapter 3 — Gemini Summary Pruner & Agentic Tree Search Engine

## 1. Chapter Goal

The goal of this chapter is to build the **`SummaryPruner` Class** (`src/search/SummaryPruner.js`) and **`AgenticTreeSearchEngine` Class** (`src/search/AgenticTreeSearchEngine.js`).

Traditional vector search relies on mathematical distance metrics. Advanced Vectorless RAG uses **LLM Branch Reasoning** (Google Gemini API via `callGemini`). At each level of the tree hierarchy, `SummaryPruner` submits candidate node summaries to Gemini, which returns a JSON decision specifying which document branch to enter.

In this chapter, we:
* Build the Gemini-Powered `SummaryPruner` (`src/search/SummaryPruner.js`)
* Build the `AgenticTreeSearchEngine` (`src/search/AgenticTreeSearchEngine.js`)
* Implement LLM reasoning branch selection with local scoring fallbacks

---

### 🎯 Expected Outcome

The search engine pinpoints exact leaf sections using Gemini LLM reasoning:

```text
Query: "How do sticky sessions handle failover?"
  │
  ├── Gemini Agent evaluates Root Children ──> Selects "Load Balancing"
  ├── Gemini Agent evaluates Sub-sections ──> Selects "Sticky Sessions"
  └── Target Leaf Chunks Retrieved
```

---

## 2. Implementing `SummaryPruner` (`src/search/SummaryPruner.js`)

### File Path

```text
adv-vectorless-rag/src/search/SummaryPruner.js
```

### Code

```javascript
import { config } from "../config.js";
import { callGemini } from "./geminiClient.js";

export class SummaryPruner {
  static calculateRelevanceScore(query, node) {
    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter((t) => t.length > 2);
    const nodeText = `${node.title} ${node.summary} ${node.keywords.join(" ")} ${node.entities.join(" ")}`.toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      if (nodeText.includes(term)) score += 2.0;
    }
    for (const term of queryTerms) {
      if (node.title.toLowerCase().includes(term)) score += 3.0;
    }
    return score;
  }

  static async evaluateWithGemini(query, candidateNodes) {
    const candidatesText = candidateNodes
      .map((n, i) => `Option ${i + 1} [ID: ${n.nodeId}]: ${n.title}\nSummary: ${n.summary}\nKeywords: ${n.keywords.join(", ")}`)
      .join("\n\n");

    const systemInstruction =
      'You are an expert AI retrieval agent navigating a hierarchical document index. ' +
      'Evaluate candidate options and respond ONLY with a JSON object format: ' +
      '{"selectedNodeId": "<node_id>", "reasoning": "<short_explanation>"}';

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
      } catch {
        // Fallback to local scoring if parsing fails
      }
    }
    return null;
  }

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
adv-vectorless-rag/src/search/AgenticTreeSearchEngine.js
```

### Code

```javascript
import { SummaryPruner } from "./SummaryPruner.js";

export class AgenticTreeSearchEngine {
  constructor(treeIndex) {
    this.index = treeIndex;
  }

  async search(query, maxDepth = 3) {
    console.log(`\n🔍 [Agentic Tree Search Engine] Query: "${query}"`);
    const logs = [];
    const matchedLeaves = [];

    if (!this.index || !this.index.root) {
      return { matchedLeaves, logs, error: "Empty or invalid tree index." };
    }

    let currentNode = this.index.root;
    let depth = 0;

    while (currentNode && depth < maxDepth) {
      depth++;

      if (currentNode.isLeaf()) {
        matchedLeaves.push(currentNode);
        console.log(`   └─ 🎯 Reached Leaf Target: "${currentNode.title}" (Pages ${currentNode.pageStart}-${currentNode.pageEnd})`);
        break;
      }

      console.log(`   ├─ Level ${depth}: Evaluating ${currentNode.children.length} child branch(es) of "${currentNode.title}"...`);

      // Try Gemini Agent Branch Selection
      const geminiSelected = await SummaryPruner.evaluateWithGemini(query, currentNode.children);

      if (geminiSelected) {
        currentNode = geminiSelected;
      } else {
        // Local scoring fallback
        const pruned = SummaryPruner.pruneNodes(query, currentNode.children);
        if (pruned.length > 0) {
          currentNode = pruned[0];
          console.log(`   │  └─ Local Fallback Selected Branch: "${currentNode.title}"`);
        } else {
          console.log(`   │  └─ No child branch met threshold. Stopping search.`);
          break;
        }
      }
    }

    const retrievedChunks = matchedLeaves.map((leaf) => ({
      title: leaf.title,
      pageStart: leaf.pageStart,
      pageEnd: leaf.pageEnd,
      chunks: leaf.chunks
    }));

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
const index = TreeBuilder.buildFromStructuredSections('Guide', [{ title: 'Failover', level: 1, content: 'Recovery specs' }]);
const engine = new AgenticTreeSearchEngine(index);
engine.search('failover').then(res => console.log('Matches:', res.matchedLeavesCount));
"
```

### Expected Output

```text
Matches: 1
```

Move to **Chapter 4** to build the LLM Wiki Architecture & Vault Manager.
