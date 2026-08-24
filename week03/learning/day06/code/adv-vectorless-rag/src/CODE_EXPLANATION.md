# 📄 Source Directory Overview (`src/`)

This directory contains the central configuration and entry-point scripts for the **`adv-vectorless-rag`** application.

---

## 📂 File Summary

| File Path | Description |
| :--- | :--- |
| [`src/config.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/config.js) | Reads environment settings (`.env`) safely with zero external dependencies and exports central `config`. |
| [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/index.js) | Main programmatic entry point running all system demos (Tree Search, LLM Wiki, Benchmark). |
| [`src/cli.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/cli.js) | Interactive terminal CLI driver supporting flags `--mode=tree`, `--mode=wiki`, `--mode=benchmark`. |

---

## 🔄 Programmatic Execution Flow (`src/index.js`)

```text
src/index.js
  ├── Step 1: Initialize HierarchicalTreeIndex via TreeBuilder
  ├── Step 2: Instantiate AgenticTreeSearchEngine & run top-down query search
  ├── Step 3: Initialize WikiVault via LLMLibrarian
  ├── Step 4: Instantiate TwoPassRetriever & run 2-pass catalog search
  └── Step 5: Execute VectorVsVectorlessBenchmark comparing Fixed Chunk RAG vs PageIndex RAG
```
