# 🧪 Day 07 — Sample Code & Demonstration Executables

This directory contains clean, standalone JavaScript examples demonstrating the concepts taught in **Day 07: Memory in AI Agents & vLLM High-Performance Inference**.

---

## 📁 Code Modules

1. **`01_short_term_memory.js`**
   - Implements Short-Term Memory (STM) using a sliding-window message buffer.
   - Demonstrates how recent chat history is maintained across API calls.
   - **Run:** `node 01_short_term_memory.js`

2. **`02_long_term_memory_rag.js`**
   - Implements Long-Term Memory (LTM) with Fact Extraction (Semantic Memory) & Event Logging (Episodic Memory).
   - Demonstrates vector similarity retrieval and context payload assembly (`STM + LTM RAG + Query`).
   - **Run:** `node 02_long_term_memory_rag.js`

3. **`03_memory_dreaming_reflection.js`**
   - Implements background Memory Reflection ("Dreaming").
   - Merges duplicate facts, updates contradictory records, and prunes stale memory without mutating original logs.
   - **Run:** `node 03_memory_dreaming_reflection.js`

4. **`04_vllm_inference_client.js`**
   - Demonstrates open-weights model inference requesting via a vLLM engine.
   - Explains Prefill/Decode execution, PagedAttention, and OpenAI-compatible API serving.
   - **Run:** `node 04_vllm_inference_client.js`

---

## 🚀 Quick Run All

You can test any script directly using Node.js:

```bash
node 01_short_term_memory.js
node 02_long_term_memory_rag.js
node 03_memory_dreaming_reflection.js
node 04_vllm_inference_client.js
```
