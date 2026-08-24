# ⚡ Benchmark Layer (`src/comparison/`)

This component provides side-by-side performance and structural comparison between traditional Fixed-Chunking Vector RAG and Vectorless Tree-Search RAG.

---

## 📂 File Map

| File Path | Purpose |
| :--- | :--- |
| [`src/comparison/VectorVsVectorlessBenchmark.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/comparison/VectorVsVectorlessBenchmark.js) | Benchmark suite running side-by-side comparison of fixed 150-char chunking vs PageIndex tree traversal. |

---

## 🔬 Benchmark Comparison Metrics

1. **Fixed Token Chunking Simulation**:
   * Splits raw text into arbitrary 150-character chunks.
   * Demonstrates how sentence breaks lose header context and section lineage.

2. **Vectorless RAG Tree Traversal**:
   * Preserves section boundary, chapter context, and page numbers (`pp. 161-250`).
   * Provides full root-to-leaf lineage (`root -> ch_2 -> sec_2_2`).
