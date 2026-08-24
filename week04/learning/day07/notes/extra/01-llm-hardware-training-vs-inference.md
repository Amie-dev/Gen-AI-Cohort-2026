# 01 — LLM Hardware Mechanics: Training vs Inference

> **Core Concept:** LLM workloads differ drastically between Training and Inference. While training is **compute-bound**, production inference serving is **memory-bandwidth bound**.

---

## 1. Why GPU Memory & Compute Are Expensive

Deploying open-weights LLMs in production requires specialized high-performance hardware:

* **GPU VRAM & HBM (High Bandwidth Memory):** Scarce, high-cost hardware components.
* **Underutilization Challenge:** Simply purchasing GPUs is insufficient; naive serving setups fail to optimize VRAM bandwidth and SRAM utilization efficiently.

---

## 2. Training Phase vs. Inference Phase Breakdown

| Dimension | Training Phase | Inference Phase |
| :--- | :--- | :--- |
| **Model Weights** | **Adjustable** (Updated via backpropagation gradients). | **Fixed / Frozen** (Read-only weight matrices). |
| **Execution Pattern** | Large, fixed training batch runs. | Continuous, dynamic streaming requests from multiple users. |
| **GPU Usage** | One-time compute burst (weeks or months). | Continuous 24/7 production serving. |
| **Hardware Bottleneck** | **Compute-Bound** (FLOPS for matrix multiplications). | **Memory-Bandwidth Bound** (Fetching KV cache & weight matrices per generated token). |

---

## 3. The Memory-Bandwidth Bottleneck in Inference

During inference token generation, the GPU must move billions of weight parameters and Key-Value (KV) attention caches from High Bandwidth Memory (HBM/VRAM) to local SRAM execution registers for **every single generated token**.

Without an optimized inference engine, GPU compute cores remain idle waiting for memory transfer.
