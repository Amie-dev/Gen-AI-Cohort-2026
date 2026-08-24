# 📖 Production RAG with Memory: Exhaustive Code Explanation & Walkthrough

This explanation document details the design, architecture, and module implementations of the **RAG with Memory** codebase located in [`week04/learning/day07/code/rag+memory`](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/).

For complete architecture flowcharts, component breakdowns, context payload assembly models, and step-by-step documentation, please refer to the primary documentation file:
👉 **[README.md](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/README.md)**

---

## 📌 Quick Summary of Implemented Modules

1. **[src/rag/Guardrails.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/rag/Guardrails.js)**: Sanitizes input query (masking emails, phone numbers, and API keys into PII tokens) and unmasks PII tokens in the assistant response.
2. **[src/rag/QueryTranslator.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/rag/QueryTranslator.js)**: Translates user query into Rewritten query, Step-Back conceptual query, Sub-Queries, and HyDE hypothetical answer passages.
3. **[src/rag/DocumentStore.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/rag/DocumentStore.js)**: In-memory knowledge chunk store with dense vector and sparse keyword matching.
4. **[src/rag/HybridRanker.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/rag/HybridRanker.js)**: Implements Reciprocal Rank Fusion (RRF) with constant $k=60$ to rank multi-query candidates.
5. **[src/rag/CRAG.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/rag/CRAG.js)**: Corrective RAG evaluator scoring context relevance and groundedness.
6. **[src/memory/ShortTermMemory.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/memory/ShortTermMemory.js)**: Sliding-window $N$-turn conversation history buffer.
7. **[src/memory/LongTermMemory.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/memory/LongTermMemory.js)**: Semantic fact store & Episodic event log with Vector RAG lookup and hit-score metrics.
8. **[src/memory/MemoryExtractor.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/memory/MemoryExtractor.js)**: Automatically extracts new user facts/preferences from incoming messages.
9. **[src/memory/MemoryReflection.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/memory/MemoryReflection.js)**: Memory Dreaming background job for fact deduplication, contradiction resolution, and stale fact eviction.
10. **[src/agent/RAGMemoryAgent.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/src/agent/RAGMemoryAgent.js)**: Master Orchestrator bringing together RAG, Memory, and LLM synthesis.
11. **[index.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/rag+memory/index.js)**: Runnable end-to-end multi-turn conversation test script.
