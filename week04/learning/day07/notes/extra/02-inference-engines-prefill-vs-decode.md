# 02 — Inference Engines: Prefill vs Decode Phases

> **Core Concept:** An **Inference Engine** is the serving layer between users and the GPU. It manages incoming requests, batching, KV-cache memory, and GPU execution so that LLM inference can use hardware efficiently.

---

## 1. What Is an Inference Engine?

When serving an open-weight LLM directly, the application would need to handle many GPU-serving concerns itself.

An inference engine works as a high-performance serving layer—similar to how **Nginx** sits between clients and backend servers.

```text
Traditional Web Application

User Requests
      ↓
┌──────────────┐
│    Nginx     │
│ Web Server   │
└──────┬───────┘
       ↓
 Backend Application
```

For LLMs:

```text
LLM Serving

User Requests
      ↓
┌─────────────────────┐
│  Inference Engine   │
│                     │
│ • Request Queue     │
│ • Dynamic Batching  │
│ • KV Cache Manager  │
│ • GPU Scheduling    │
└──────────┬──────────┘
           ↓
     GPU VRAM / Cores
           ↓
      LLM Execution
```

The inference engine is responsible for efficiently coordinating many requests with the available GPU resources.

### Main Responsibilities

#### 1. Request Queuing

Incoming requests are placed into a queue and scheduled for execution.

```text
Request A ─┐
Request B ─┤
Request C ─┼──→ Inference Engine ──→ GPU
Request D ─┘
```

This prevents every request from independently trying to access the GPU.

#### 2. Dynamic / Iteration-Level Batching

Instead of processing every request separately, the engine can combine active requests into batches.

```text
Request A ─┐
Request B ─┼──→ Dynamic Batch ──→ GPU
Request C ─┘
```

The batch can change dynamically as requests finish and new requests arrive.

#### 3. KV Cache Management

During generation, the model creates and uses **Key-Value (KV) cache** data.

The inference engine manages how this cache is allocated and accessed in GPU memory.

#### 4. GPU Optimizations

Inference engines can use GPU-specific optimizations such as **CUDA Graphs** to reduce execution overhead and improve serving efficiency.

---

# 2. LLM Text Generation

Autoregressive LLM generation can be divided into two major phases:

```text
User Prompt
     │
     ▼
┌──────────────┐
│   PREFILL    │
│              │
│ Process      │
│ prompt       │
└──────┬───────┘
       │
       ▼
 First Output Token
       │
       ▼
┌──────────────┐
│    DECODE    │
│              │
│ Generate     │
│ one token    │
│ at a time    │
└──────┬───────┘
       │
       ▼
  Final Response
```

These two phases have very different computational characteristics.

---

# 3. Prefill Phase

The **Prefill Phase** happens when the model receives the initial prompt.

For example:

```text
Prompt:

"Explain how RAG works in production."
```

After tokenization:

```text
[T1] [T2] [T3] [T4] [T5] [T6]
```

The model processes the prompt tokens together.

```text
Prompt Tokens
[T1] [T2] [T3] [T4] [T5] [T6]
   \    |    |    |    |    /
    \   |    |    |    |   /
       Parallel Processing
              ↓
         Transformer
              ↓
          KV Cache
              ↓
      First Output Token
```

### What happens during Prefill?

1. The prompt is tokenized.
2. Prompt tokens are processed by the transformer.
3. Attention computations are performed.
4. Key and Value states are generated.
5. These states are stored in the **KV cache**.
6. The model produces the first output token.

### Important Characteristics

**Prefill is:**

* Highly parallel
* Computationally intensive
* Heavy on GPU compute
* Responsible for processing the initial prompt
* Responsible for creating the initial KV cache

---

# 4. Decode Phase

After Prefill produces the first output token, the model enters the **Decode Phase**.

Suppose the first generated token is:

```text
T5
```

The model then generates:

```text
T6 → T7 → T8 → T9 → ...
```

The important difference is that generation happens **autoregressively**.

```text
T5
 ↓
T6
 ↓
T7
 ↓
T8
 ↓
T9
```

The next token depends on the tokens generated previously.

### Simplified Decode Process

```text
Existing KV Cache
       +
Current Token
       ↓
     GPU
       ↓
Next Token
       ↓
Update KV Cache
       ↓
     GPU
       ↓
Next Token
       ↓
     ...
```

For every generated token, the inference engine and GPU need to work with the existing KV cache.

### Why KV Cache Matters

Without KV caching, the model would repeatedly recompute previous attention information.

Instead, previously calculated Key/Value information is stored and reused.

```text
Previous Context
      ↓
┌──────────────┐
│   KV Cache   │
└──────┬───────┘
       │
       ├───────────┐
       │           │
Current Token     Reuse Previous KV
       │           │
       └─────┬─────┘
             ↓
           GPU
             ↓
        Next Token
```

### Important Characteristics

**Decode is:**

* Sequential
* Autoregressive
* Repeated once for every generated token
* Highly dependent on efficient KV-cache access
* Strongly affected by memory bandwidth

---

# 5. Prefill vs Decode

| Feature                     | Prefill                        | Decode                           |
| --------------------------- | ------------------------------ | -------------------------------- |
| **Purpose**                 | Process input prompt           | Generate output                  |
| **Processing**              | Highly parallel                | Sequential                       |
| **Tokens**                  | Many prompt tokens together    | Usually one new token at a time  |
| **Main Work**               | Encode prompt & build KV cache | Reuse KV cache & generate tokens |
| **Compute Characteristics** | Compute-heavy                  | Memory-bandwidth sensitive       |
| **KV Cache**                | Created/populated              | Read and updated repeatedly      |

The key distinction is:

> **Prefill processes the prompt; Decode generates the answer.**

---

# 6. Complete Request Lifecycle

A simplified request looks like this:

```text
User
 │
 │ Prompt
 ▼
Inference Engine
 │
 ▼
┌──────────────────────┐
│      PREFILL         │
│                      │
│ Process all prompt   │
│ tokens in parallel   │
└──────────┬───────────┘
           │
           ▼
     First Token
           │
           ▼
┌──────────────────────┐
│       DECODE         │
│                      │
│ Generate T6          │
│ Generate T7          │
│ Generate T8          │
│ Generate T9          │
│       ...            │
└──────────┬───────────┘
           │
           ▼
   Streaming Response
           │
           ▼
         User
```

---

# 7. Why Prefill and Decode Can Conflict

The two phases have different resource requirements.

```text
PREFILL
────────
Large prompt
     ↓
High parallel computation
     ↓
Heavy GPU workload


DECODE
──────
One token at a time
     ↓
Repeated KV-cache access
     ↓
Latency-sensitive
```

If a large Prefill request starts consuming substantial GPU resources while many users are waiting for Decode steps, those Decode requests may experience increased latency.

For example:

```text
Large Prompt
     │
     ▼
┌──────────────┐
│   PREFILL    │
│ Heavy GPU    │
│ computation  │
└──────┬───────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
 Decode A            Decode B
 waiting             waiting
```

This creates a scheduling problem for high-throughput LLM serving.

---

# 8. Disaggregated Prefill & Decode

To address this problem, large-scale inference infrastructure can separate the two workloads.

Instead of using the same GPU pool for everything:

```text
                    Requests
                       │
                       ▼
              ┌─────────────────┐
              │ Inference Layer │
              └────────┬────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
     ┌──────────────┐     ┌──────────────┐
     │ Prefill      │     │ Decode       │
     │ Nodes        │     │ Nodes        │
     │              │     │              │
     │ Prompt       │     │ Token        │
     │ Processing   │     │ Generation   │
     └──────────────┘     └──────────────┘
```

### Prefill Nodes

Optimized for:

* Large prompt processing
* Parallel computation
* High compute utilization

### Decode Nodes

Optimized for:

* Continuous token generation
* KV-cache management
* Low-latency generation
* Efficient memory access

This architecture allows the infrastructure to tune resources independently for the two phases.

---

# 9. Key Takeaways

### Inference Engine

The inference engine manages:

```text
Requests
   ↓
Queue
   ↓
Batching
   ↓
KV Cache
   ↓
GPU Scheduling
   ↓
LLM
```

### Prefill

```text
Prompt
  ↓
Parallel Processing
  ↓
KV Cache Creation
  ↓
First Token
```

### Decode

```text
KV Cache + Current Token
          ↓
        GPU
          ↓
      Next Token
          ↓
      Repeat...
```

### Production Optimization

```text
                 LLM Serving
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       Prefill                Decode
    Compute-heavy         Memory-sensitive
          │                     │
          └──────────┬──────────┘
                     ▼
             Efficient Serving
```

> **Remember:** **Prefill is about processing the prompt efficiently. Decode is about generating tokens efficiently.** Separating these workloads can improve resource utilization and reduce interference between compute-heavy prompt processing and latency-sensitive token generation.
