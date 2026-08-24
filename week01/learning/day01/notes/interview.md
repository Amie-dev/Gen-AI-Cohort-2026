# 🎯 Week 01 — Day 01 Interview Questions & Deep Dive Answers

# Topic: Introduction to Generative AI, LLMs & Transformers

> **Target Audience:** AI Application Engineers, Full-Stack Engineers building LLM applications, and Gen AI Engineers.

---

## 📑 Table of Contents

1. [Category 1 — Foundational & Architecture Concepts](#1-category-1--foundational--architecture-concepts)
2. [Category 2 — Tokenizer Mechanics & Sub-Word Algorithms](#2-category-2--tokenizer-mechanics--sub-word-algorithms)
3. [Category 3 — Transformer Pipeline (Embeddings, Attention & Sampling)](#3-category-3--transformer-pipeline-embeddings-attention--sampling)
4. [Category 4 — Training vs Inference & System Constraints](#4-category-4--training-vs-inference--system-constraints)
5. [Category 5 — Application Engineering & Multi-Provider Ecosystem](#5-category-5--application-engineering--multi-provider-ecosystem)

---

# 1. Category 1 — Foundational & Architecture Concepts

## Q1: What is the difference between GPT and ChatGPT? Explain using an engineering analogy.

### 💡 Answer:
* **GPT (Generative Pre-trained Transformer):** Is the underlying **AI model/engine**. It is a neural network trained on vast text data to perform next-token prediction. It has no built-in web interface, session storage, or UI layout.
* **ChatGPT:** Is the complete **application built on top of GPT**. It includes the user interface (UI), frontend components, conversation state/session management, safety guardrails, moderation filters, and payment/auth layers, powered by the GPT model inside.

### 🚘 Engineering Analogy:
| Car Concept | AI System Equivalent | Description |
| :--- | :--- | :--- |
| **Car Body** | **ChatGPT Application** | The dashboard, wheels, steering wheel, and seats that the driver interacts with. |
| **Engine** | **GPT Model (LLM)** | The hidden core machinery that converts fuel into rotational motion. |
| **Fuel** | **User Prompt** | The input provided to trigger execution. |
| **Driver** | **End User** | The person giving instructions. |

### 🛠️ Role Perspective:
* **ML Engineer:** Focuses on the **Engine** (training neural networks, optimizing backpropagation, model weights).
* **Application Engineer:** Focuses on the **Car Body** (integrating LLM APIs, building UIs, managing state, implementing retrieval and tool calling).

---

## Q2: What is a Large Language Model (LLM), and how does auto-regressive generation work?

### 💡 Answer:
A **Large Language Model (LLM)** is a deep learning model (typically based on the Transformer architecture) trained on massive text corpora to understand and generate natural language.

At its core, an LLM is a **probabilistic next-token predictor**. It operates **auto-regressively**: it receives a sequence of input tokens, computes a probability distribution over its vocabulary for the next position, picks a token, appends that token to the input sequence, and repeats the process until an end-of-sequence (`<EOS>`) token is emitted or max token length is reached.

### 🔄 Auto-Regressive Step-by-Step Generation:
```text
Input Sequence: "Tell me about"
Step 1: Predicts "myself."  --> Sequence becomes: "Tell me about myself."
Step 2: Predicts "I"        --> Sequence becomes: "Tell me about myself. I"
Step 3: Predicts "am"       --> Sequence becomes: "Tell me about myself. I am"
Step 4: Predicts "a"        --> Sequence becomes: "Tell me about myself. I am a"
Step 5: Predicts "developer"--> Sequence becomes: "Tell me about myself. I am a developer"
```

---

## Q3: What is the significance of the "Attention Is All You Need" paper (2017), and how did Transformers outperform RNNs/LSTMs?

### 💡 Answer:
Prior to 2017, natural language processing relied heavily on **Recurrent Neural Networks (RNNs)** and **Long Short-Term Memory (LSTM)** networks. These architectures processed tokens sequentially, token by token.

### 🛑 Why RNNs/LSTMs Failed to Scale:
1. **Sequential Bottleneck:** Step $t$ depended on hidden state $t-1$, making parallel processing on GPUs impossible during training.
2. **Vanishing/Exploding Gradients:** Long-range context degraded because information had to pass through hundreds of sequential steps.

### ✨ The Transformer Breakthrough:
The 2017 paper *"Attention Is All You Need"* by Google researchers introduced the **Transformer architecture**, which replaced recurrent loops with **Self-Attention**:
* **Massive Parallelism:** All tokens in a sequence are processed simultaneously during training, unlocking modern GPU scale.
* **Direct Context Connections:** Self-attention computes direct relationships between *any* two tokens regardless of their distance in the text.

---

# 2. Category 2 — Tokenizer Mechanics & Sub-Word Algorithms

## Q4: What is a Token and why do LLMs process tokens instead of raw characters or full words?

### 💡 Answer:
A **token** is the foundational atomic unit of text that an LLM processes. A token can represent a whole word (e.g. `"hello"`), sub-word fragment (e.g. `"ing"`), single character, or punctuation mark.

### 🔍 Why Characters vs. Words vs. Sub-word Tokens?
* **Character-Level:** Vocabulary is tiny (~256 characters), but sequences become extremely long. Models lose semantic focus because a single word takes 10+ steps to generate.
* **Word-Level:** Vocabulary is infinite (millions of words across languages). Any novel word or typo becomes an Out-Of-Vocabulary (`<UNK>`) error. Massive memory footprint.
* **Sub-Word Tokens (Optimal Hybrid):** Maintains a fixed vocabulary size (e.g., 50k to 200k tokens). Common words stay as single tokens, while rare words or typos split into sub-word chunks.

---

## Q5: How does the Byte-Pair Encoding (BPE) algorithm work?

### 💡 Answer:
**Byte-Pair Encoding (BPE)** is a data compression algorithm adapted for LLM tokenization. It builds a fixed-size sub-word vocabulary iteratively from a training corpus.

### ⚙️ Algorithmic Steps:
1. **Initialize Vocabulary:** Treat all base characters/bytes in the training corpus as initial individual tokens.
2. **Count Co-occurrences:** Scan the corpus to find the most frequently occurring adjacent pair of tokens (e.g., `'t'` + `'h'`).
3. **Merge Pair:** Merge that pair into a single new token (e.g., `'th'`).
4. **Iterate:** Repeat scanning and merging most frequent pairs until the target vocabulary size (e.g. 100,000) is reached.

```text
Corpus: "low lower newest widest"
Iteration 1: Merge ('e', 's') -> 'es'
Iteration 2: Merge ('e', 't') -> 'et'
Iteration 3: Merge ('e', 'r') -> 'er'
Iteration N: Common word "lower" becomes a single token.
```

---

## Q6: What is the "Multilingual Token Tax" and how do newer tokenizers like `o200k_base` address it?

### 💡 Answer:
* **The Multilingual Token Tax:** Older tokenizers (e.g. `gpt2` with ~50k vocabulary or `cl100k_base` with ~100k vocabulary) were optimized heavily for English. Non-English scripts (such as Bengali, Hindi, Arabic, or Cyrillic) split into multiple tokens per character—sometimes 3 to 4 tokens for a single word.
* **Financial & Latency Impact:** A non-English user paid up to 3x–4x more per sentence in API costs and hit context window limits much faster.
* **Solution (`o200k_base`):** OpenAI's `o200k_base` tokenizer (used in GPT-4o) doubled vocabulary size to ~200,000 tokens. It includes dedicated tokens for multi-byte non-Latin scripts, drastically reducing token counts for global languages and making API execution faster and cheaper.

### 📊 Tokenizer Comparison Table:
| Tokenizer Name | Model Usage | Vocabulary Size | Key Characteristics |
| :--- | :--- | :--- | :--- |
| **`gpt2`** | GPT-2 | ~50,257 | Basic BPE implementation, inefficient on code/whitespace. |
| **`cl100k_base`** | GPT-3.5-Turbo, GPT-4 | ~100,000 | Optimized for source code, whitespace, and special tokens. |
| **`o200k_base`** | GPT-4o, GPT-4o-mini | ~200,000 | Massive multi-lingual support, eliminates token tax for non-English scripts. |

---

# 3. Category 3 — Transformer Pipeline (Embeddings, Attention & Sampling)

## Q7: What are Vector Embeddings, and how do they capture semantic meaning?

### 💡 Answer:
After tokenization converts text into integer token IDs, the LLM maps each token ID to a **Vector Embedding**—a dense vector of floating-point numbers (e.g. 1,536 or 4,096 dimensions).

An embedding translates discrete tokens into a high-dimensional vector space where geometric distance correlates with **semantic similarity**:

$$\text{Similarity}(\vec{A}, \vec{B}) = \cos(\theta) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$

Tokens with similar meanings (e.g., `"king"` and `"queen"`, or `"Paris"` and `"France"`) cluster closely together in embedding space.

```text
Spatial Conceptual Clusters:
[ Paris, London, Berlin, Tokyo ]  <---> Capital Cities Cluster
[ Apple, Banana, Orange, Mango ] <---> Fruit Cluster
```

---

## Q8: Why do Transformers require Positional Encoding?

### 💡 Answer:
Because the Transformer's self-attention mechanism processes all input tokens in parallel simultaneously, it is **permutation-invariant** by default—meaning it treats a sentence as an unordered "bag of words."

Without positional encoding, the Transformer cannot differentiate between:
1. *"Aminul loves ice cream."*
2. *"Ice cream loves Aminul."*

**Positional Encoding** adds a position vector (derived using sine/cosine wave functions or learned positional embeddings) to the token embedding before feeding it into attention layers, explicitly injecting word order information.

---

## Q9: What is Self-Attention, and how does Multi-Head Attention work?

### 💡 Answer:
* **Self-Attention:** Allows each token in a sentence to look at ("attend to") every other token to compute contextual relevance.
  * *Example:* In *"I deposited money in the bank"*, self-attention links *"bank"* with *"money"*, resolving its meaning as a financial institution. In *"The boat hit the river bank"*, it links *"bank"* with *"river"*.

* **Multi-Head Attention:** Instead of calculating attention once, Multi-Head Attention splits embeddings across multiple parallel "heads" (e.g., 8, 12, or 32 heads).
  * **Head 1:** May focus on grammatical subject-verb relationships.
  * **Head 2:** May focus on long-range pronoun resolution.
  * **Head 3:** May focus on semantic topic association.

The outputs of all heads are concatenated and linearly transformed.

---

## Q10: How do Softmax, Temperature, and Top-p (Nucleus Sampling) control LLM generation randomness?

### 💡 Answer:

```text
Logits (Raw Scores) ──> [ Temperature Scaling ] ──> [ Softmax (Probabilities) ] ──> [ Top-p Truncation ] ──> Next Token Choice
```

### 1. Softmax Function
Converts raw output scores (logits $z_i$) from the final layer into normalized probabilities $P(i)$ that sum to 1:

$$P(i) = \frac{e^{z_i / T}}{\sum_{j} e^{z_j / T}}$$

### 2. Temperature ($T$)
Controls the flatness of the probability distribution:
* **Low Temperature ($T = 0.2$):** Sharpens probabilities. The top token dominates. Output is deterministic, focused, and ideal for coding/math.
* **High Temperature ($T = 1.2$):** Flattens probabilities, making lower-ranked tokens more likely. Output is creative and diverse, but risks hallucination.

### 3. Top-p (Nucleus Sampling)
Instead of considering all 100,000+ vocabulary tokens, Top-p dynamically selects the smallest candidate subset whose cumulative probability reaches threshold $p$ (e.g. $p = 0.90$). Tokens outside this "nucleus" are discarded, preventing nonsensical low-probability tokens.

> ⚠️ **Best Practice:** Adjust **either** Temperature **or** Top-p, but avoid tuning both simultaneously in production applications.

---

# 4. Category 4 — Training vs Inference & System Constraints

## Q11: Compare the Training Phase vs Inference Phase of an LLM.

### 💡 Answer:

| Feature / Dimension | Training Phase | Inference Phase |
| :--- | :--- | :--- |
| **Model Weights** | **Adjustable** (Updated continuously via gradients). | **Fixed / Frozen** (Read-only execution). |
| **Primary Goal** | Learn general language patterns & minimize loss. | Generate answers for user prompts in production. |
| **Hardware Bottleneck** | **Compute-Bound** (TFLOPS for backpropagation matrix math). | **Memory-Bandwidth Bound** (Moving KV cache & weights from VRAM to SRAM). |
| **Frequency** | Executed once by foundation model creators over weeks/months. | Executed continuously 24/7 per user prompt. |
| **Input/Output** | Terabytes of training text dataset + labels. | User prompt string $\to$ generated response string. |

---

## Q12: What is Cross-Entropy Loss, and what is a "Label" in LLM training?

### 💡 Answer:
* **Label (Ground Truth):** During self-supervised pre-training, the model is given a text chunk (e.g., `"The capital of France is"`) and the **label** is the actual next token in the dataset (`"Paris"`).
* **Cross-Entropy Loss:** Is the loss function used to measure how far the model's predicted probability distribution $P$ is from the true target label distribution $Y$:

$$\mathcal{L}_{CE} = - \sum_{i} Y_i \log(P_i)$$

The training optimizer (e.g. AdamW) uses this loss value to calculate gradients and update model weight matrices, penalizing the model when it assigns low probability to the correct next token.

---

## Q13: What is a Context Window, and what happens when prompt token count exceeds context limits?

### 💡 Answer:
The **Context Window** is the maximum number of tokens an LLM can process in a single execution call. It includes:
1. System Prompt instructions
2. Retrieved context (RAG chunks / database entries)
3. Conversation history turns
4. User's new query
5. Max output tokens to generate

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           TOTAL CONTEXT WINDOW                          │
├─────────────────┬──────────────────┬─────────────────┬──────────────────┤
│  System Prompt  │  Chat History    │   User Query    │ Output Generation│
└─────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

### 💥 What happens when limits are exceeded?
* **API Error:** Providers return HTTP 400 (`context_length_exceeded`).
* **Silent Truncation:** Naive applications drop oldest history turns to fit within limits, leading to loss of past conversational context.

---

# 5. Category 5 — Application Engineering & Multi-Provider Ecosystem

## Q14: How do you securely handle API keys in Node.js without using third-party libraries like `dotenv`?

### 💡 Answer:
Starting in **Node.js v20.6.0+**, Node includes native support for loading environment variables using the `--env-file` flag.

### 🛠️ Implementation Steps:
1. Create a `.env` file in project root (ensure `.env` is listed in `.gitignore`):
   ```env
   OPENAI_API_KEY=sk-proj-actual-api-key-here
   ```

2. Execute script via CLI using native flag:
   ```bash
   node --env-file=.env index.js
   ```

3. Read environment variable natively in code:
   ```javascript
   const apiKey = process.env.OPENAI_API_KEY;
   ```

---

## Q15: Compare OpenAI, Google Gemini, Groq, and Mistral AI from an Application Engineer's perspective.

### 💡 Answer:

| Feature | OpenAI | Google Gemini | Groq | Mistral AI |
| :--- | :--- | :--- | :--- | :--- |
| **Official NPM Package** | `openai` | `@google/genai` | `groq-sdk` | `@mistralai/mistralai` |
| **Env Variable Key** | `OPENAI_API_KEY` | `GEMINI_API_KEY` | `GROQ_API_KEY` | `MISTRAL_API_KEY` |
| **Key Advantage** | Ecosystem maturity, state-of-the-art models (`gpt-4o`). | Massive context windows (up to 2M tokens), native multimodality. | Ultra-low latency (>500 tokens/sec) powered by custom **LPU** hardware. | European open-weights champion, self-hostable models. |
| **Primary Model** | `gpt-4o-mini` | `gemini-2.5-flash` | `llama-3.3-70b-versatile` | `mistral-large-latest` |

---

## Q16: Write a production-ready Node.js snippet using the OpenAI SDK to request a chat completion.

### 💡 Answer:

```javascript
import { OpenAI } from "openai";

// Initialize OpenAI client (automatically uses process.env.OPENAI_API_KEY)
const openai = new OpenAI();

async function main() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: "You are an expert AI Application Engineer assisting developers."
        },
        {
          role: "user",
          content: "Explain the difference between Temperature and Top-p sampling."
        }
      ]
    });

    console.log("=== Response ===");
    console.log(response.choices[0].message.content);
    console.log("\n=== Token Usage ===");
    console.log(`Prompt Tokens: ${response.usage.prompt_tokens}`);
    console.log(`Completion Tokens: ${response.usage.completion_tokens}`);
  } catch (error) {
    console.error("OpenAI API Request Failed:", error);
  }
}

main();
```
