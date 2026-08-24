# 🔍 Agentic Search & Evaluation Layer (`src/search/`)

This component implements **Top-Down Agentic Tree Traversal** and summary pruning, powered by Google Gemini API with local term scoring fallback.

---

## 📂 File Map

| File Path | Description |
| :--- | :--- |
| [`src/search/geminiClient.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/search/geminiClient.js) | Dynamic loader for `@google/generative-ai` SDK with prompt dispatcher and fallback support. |
| [`src/search/SummaryPruner.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/search/SummaryPruner.js) | Branch summary evaluator (`calculateRelevanceScore`, `evaluateWithGemini`, `pruneNodes`). |
| [`src/search/AgenticTreeSearchEngine.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/search/AgenticTreeSearchEngine.js) | Top-down decision tree search loop (AlphaGo MCTS inspired PageIndex architecture). |

---

## 🔬 How Traversal Works

```text
User Query
  ↓
AgenticTreeSearchEngine.search()
  ↓
currentNode = treeIndex.root
  ↓
LOOP while currentNode has children:
  ├── SummaryPruner.pruneNodes(query, children)
  ├── selectBestBranch() -> tries Gemini API evaluateWithGemini() first
  │                       -> falls back to local term scoring calculateRelevanceScore()
  ├── currentNode = selectedChild
  └── record nodeId in traversalPath
  ↓
LEAF REACHED: Return leaf content & lineage path
```
