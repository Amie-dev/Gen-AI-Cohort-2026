# 01 — LLM Hardware Mechanics: Training vs Inference

> **Core Concept:** LLM workloads behave very differently during **training** and **inference**. Training is primarily **compute-bound**, while production inference is heavily affected by **memory bandwidth**.

---

## 1. Why GPU Memory & Compute Are Expensive

Running open-weight LLMs in production requires high-performance GPU hardware.

### GPU VRAM & HBM

* **VRAM** stores model weights and runtime data.
* **HBM (High Bandwidth Memory)** provides very high memory bandwidth to the GPU.
* Both are expensive and limited resources.

The challenge is not simply having powerful GPUs. The serving system must use their **memory bandwidth and compute resources efficiently**.

---

## 2. Training vs. Inference

| Dimension             | Training                                         | Inference                         |
| --------------------- | ------------------------------------------------ | --------------------------------- |
| **Model Weights**     | Updated through backpropagation                  | Fixed / read-only                 |
| **Execution Pattern** | Large, relatively fixed batches                  | Continuous, dynamic user requests |
| **GPU Usage**         | Large compute workloads running for weeks/months | Continuous production serving     |
| **Main Bottleneck**   | **Compute-bound**                                | **Memory-bandwidth bound**        |
| **Main Operation**    | Forward + backward pass                          | Forward pass + token generation   |

### Training

During training, the model processes large batches of data and performs:

```text
Input
  ↓
Forward Pass
  ↓
Loss Calculation
  ↓
Backward Pass
  ↓
Gradients
  ↓
Weight Updates
```

The GPU spends significant time performing large matrix multiplications and other computations.

Therefore, training is generally **compute-bound**.

---

### Inference

During inference, the model weights are already trained and remain fixed.

The system receives requests such as:

```text
User 1 → "Explain RAG"
User 2 → "What is vLLM?"
User 3 → "Write a Python function"
```

The inference engine continuously processes these requests and generates tokens.

```text
User Request
     ↓
Model Weights + KV Cache
     ↓
GPU
     ↓
Token 1
     ↓
Token 2
     ↓
Token 3
     ↓
...
```

The workload is different from training because the system repeatedly needs to access model weights and attention-related data while generating tokens.

---

## 3. Memory-Bandwidth Bottleneck

During token generation, the GPU needs to move model data between memory and the computation units.

A simplified view is:

```text
        GPU
┌───────────────────────┐
│                       │
│  Compute Units        │
│       ↕               │
│  SRAM / Registers     │
│       ↕               │
│  HBM / VRAM           │
│                       │
└───────────────────────┘
```

For each generated token, the system repeatedly accesses:

* **Model weights**
* **KV cache**
* Other runtime data required for attention and generation

If memory cannot supply data quickly enough, the compute units spend time **waiting for data** instead of performing useful computation.

```text
HBM / VRAM
    │
    │ Data transfer
    ▼
GPU Compute
    │
    ▼
Generated Token
    │
    └──────→ Next Token
```

This is why inference performance is strongly influenced by **memory bandwidth**, not just the number of GPU compute cores.

---

## 4. Why Naive Inference Serving Is Inefficient

Simply putting an LLM on a powerful GPU does not guarantee efficient serving.

A naive serving system may fail to:

* Efficiently utilize available **VRAM/HBM bandwidth**
* Keep GPU compute resources busy
* Manage **KV cache** efficiently
* Handle multiple concurrent requests efficiently

This can result in:

```text
Available GPU Resources
        │
        ▼
┌──────────────────────┐
│   Naive Serving      │
├──────────────────────┤
│ Memory waiting       │
│ GPU underutilized    │
│ Poor throughput      │
└──────────────────────┘
```

The goal of an inference engine is therefore to make better use of the GPU's **memory and compute resources** while serving many requests.

---

## 5. Key Takeaway

The fundamental difference is:

```text
TRAINING
────────
Large batches
     ↓
Heavy matrix computation
     ↓
Backpropagation
     ↓
Update weights
     ↓
Compute-bound


INFERENCE
─────────
User requests
     ↓
Load/access model data
     ↓
Generate token
     ↓
Repeat
     ↓
Memory-bandwidth bound
```

### Remember

> **Training asks:** *How fast can the GPU perform computation?*

> **Inference asks:** *How efficiently can the GPU move and reuse the data required to generate tokens?*

This memory-bandwidth problem is one of the key reasons specialized **LLM inference engines** are needed for high-performance production serving.
