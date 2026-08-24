# 03 — vLLM Architecture & PagedAttention Deep Dive

> **Core Concept:** Developed at UC Berkeley Sky Computing Lab, **vLLM** optimizes open-weights LLM inference using **PagedAttention**, continuous batching, and prefix caching.

---

## 1. What is vLLM?

**vLLM** is an open-source, high-throughput LLM serving engine designed to maximize GPU utilization and throughput.

```text
+-------------------------------------------------------------------+
|                        vLLM CORE ARCHITECTURE                     |
+-------------------------------------------------------------------+
|                                                                   |
|   1. PagedAttention           2. Continuous Batching              |
|      (Virtual Memory for KV)     (Iteration-Level Scheduling)     |
|                                                                   |
|   3. Chunked Prefill          4. Prefix Caching                   |
|      (Blends Prefill & Decode)   (Reuses system prompt KV cache)  |
|                                                                   |
|   5. Quantization Kernels     6. Speculative Decoding             |
|      (FP8, INT8, AWQ, GPTQ)      (EAGLE, n-gram, DFlash)          |
+-------------------------------------------------------------------+
```

---

## 2. PagedAttention: Solving KV Cache Memory Fragmentation

Traditional LLM servers pre-allocate contiguous VRAM for KV caches based on maximum sequence lengths. This leads to **60% to 80% memory waste** due to internal and external memory fragmentation.

**PagedAttention** borrows virtual memory paging from Operating Systems:

```text
Virtual KV Memory Blocks (Logical Sequence)
┌──────────┬──────────┬──────────┐
│ Block 0  │ Block 1  │ Block 2  │
└────┬─────┴────┬─────┴────┬─────┘
     │          │          │
     ▼          ▼          ▼
Physical GPU VRAM Pages (Non-Contiguous)
┌──────────┬──────────┬──────────┬──────────┐
│ Page 12  │ Page 03  │ Page 88  │ Page 04  │
└──────────┴──────────┴──────────┴──────────┘
```

* KV caches are partitioned into small physical memory pages.
* Pages are allocated dynamically on-demand during generation.
* Eliminates internal fragmentation, reducing memory waste to **< 4%** and enabling **2x–4x larger batch sizes**.

---

## 3. Advanced vLLM Serving Features

### Continuous Batching & Chunked Prefill
Schedules incoming requests dynamically at the token iteration level rather than waiting for entire batches to finish generation.

### Prefix Caching
Caches prefilled KV blocks for system prompts or multi-turn agent instructions. When new requests arrive with identical prompt prefixes, vLLM skips the Prefill phase entirely for those tokens.

### Quantization & MoE Kernels
* **Quantization Formats:** FP8, INT8, INT4, AWQ, GPTQ, GGUF, NVFP4, TorchAO.
* **Kernel Optimizations:** FlashAttention, FlashInfer, Triton, CUTLASS.
* **Architecture Support:** Decoder-only (Llama, Qwen), Mixture-of-Experts (DeepSeek-V3, Mixtral), and Multi-Modal models.
* **API Compatibility:** OpenAI-compatible REST server, Anthropic Messages API, and gRPC endpoints.
