# 📖 Advanced Vectorless RAG (`adv-vectorless-rag`): Master Code & Concept Walkthrough

Welcome! This document provides a complete, beginner-friendly walkthrough of the **`adv-vectorless-rag`** codebase. It explains how **Vectorless RAG (PageIndex Model)** and **Andrej Karpathy's LLM Wiki Architecture** work step-by-step.

---

## 💡 What is Vectorless RAG? (Core Concepts)

### Traditional Vector RAG vs. Vectorless RAG
In traditional Vector RAG:
* Documents are sliced into arbitrary fixed chunks (e.g. 150 characters or 200 tokens).
* Vectors (embeddings) are generated for each chunk and stored in a vector database.
* **Failure**: Chunking breaks sentences, cuts off table headers, and loses the parent chapter context.

In **Vectorless RAG**:
1. **PageIndex Model**: Documents are parsed into a tree structure matching their natural outline (Document $\rightarrow$ Chapters $\rightarrow$ Sections). An AI Search Agent starts at the root node and evaluates summaries to select child branches top-down.
2. **Andrej Karpathy LLM Wiki Model**: Knowledge is organized into Markdown files. Pass 1 inspects metadata (titles, tags, summaries) with 0% raw text loaded into memory. Pass 2 lazy-loads content only for the selected file.

---

## 📁 Repository Directory Structure & Component Map

Every directory in this project contains a dedicated `CODE_EXPLANATION.md` file:

* 📂 **`adv-vectorless-rag/`** (Root) $\rightarrow$ Master overview, setup guide, execution scripts.
  * 📄 [`CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/CODE_EXPLANATION.md) (This file)
* 📂 [`src/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/) $\rightarrow$ Configuration, entry point (`index.js`), CLI driver (`cli.js`).
  * 📄 [`src/CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/CODE_EXPLANATION.md)
* 📂 [`src/tree/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/tree/) $\rightarrow$ Tree node structure, tree index manager, tree builder factory.
  * 📄 [`src/tree/CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/tree/CODE_EXPLANATION.md)
* 📂 [`src/search/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/search/) $\rightarrow$ Summary evaluation, Gemini API client, top-down tree search engine.
  * 📄 [`src/search/CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/search/CODE_EXPLANATION.md)
* 📂 [`src/wiki/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/wiki/) $\rightarrow$ Markdown knowledge vault, catalog metadata list, Karpathy 2-pass retriever.
  * 📄 [`src/wiki/CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/wiki/CODE_EXPLANATION.md)
* 📂 [`src/comparison/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/comparison/) $\rightarrow$ Side-by-side benchmark comparing fixed chunking vs. tree search.
  * 📄 [`src/comparison/CODE_EXPLANATION.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/comparison/CODE_EXPLANATION.md)

---

## ⚡ Execution Guide

```bash
# 1. Run all demonstrations sequentially
npm start

# 2. Run interactive terminal CLI driver
npm run cli

# 3. Run ONLY Vectorless RAG Tree Search (PageIndex Model)
npm run tree-search

# 4. Run ONLY LLM Wiki Two-Pass Retrieval (Karpathy Model)
npm run llm-wiki

# 5. Run Vector RAG vs Vectorless RAG Comparison Benchmark
npm run benchmark
```
