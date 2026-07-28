# Week 01 – Day 01 Notes (29-06-2026)

# Introduction to Generative AI, LLMs, and Transformers

---

# Class Overview

In the first session of the Gen AI JS Cohort, we were introduced to:

* Chaicode and the course roadmap
* AI and Generative AI
* ChatGPT vs GPT
* What an LLM is
* The Transformer architecture
* How ChatGPT processes a prompt internally
* Tokenization
* Embeddings
* Positional Encoding
* Self-Attention
* Feed Forward Networks
* Softmax & Temperature
* Training vs Inference
* Context Windows
* Calling an LLM using the OpenAI SDK

The goal of today's class was **not** to build AI models but to understand **how the engine works** before learning how to build applications using it.

---

# Introduction to Chaicode

Chaicode is a learning platform focused on practical software development.

In this cohort, the primary goal is to learn **Generative AI using JavaScript**.

Instead of building machine learning models from scratch, we will learn how to build AI-powered applications using modern LLM APIs.

---

# Chaicode Team

The instructors explained the people involved in the cohort:

* Mentors
* Teaching assistants
* Community members
* Students

The course encourages asking questions, participating in discussions, and building projects together.

---

# What is Artificial Intelligence (AI)?

Artificial Intelligence (AI) is the field of computer science that enables machines to perform tasks that normally require human intelligence.

Examples include:

* Understanding language
* Recognizing images
* Translating languages
* Answering questions
* Writing code
* Playing games
* Making predictions

AI is a broad field that includes many branches, such as:

* Machine Learning (ML)
* Deep Learning
* Natural Language Processing (NLP)
* Computer Vision
* Robotics

Generative AI is a subset of AI focused on creating new content.

---

# What is Generative AI?

Generative AI is a type of AI that can generate new content instead of simply analyzing existing data.

Examples:

* Writing articles
* Answering questions
* Generating code
* Creating images
* Producing music
* Summarizing documents

Popular Generative AI models include:

* GPT
* Gemini
* Claude
* Llama
* Mistral

---

# ChatGPT Flow

Every AI application follows a simple pipeline.

```
Input
   ↓
AI Engine (LLM)
   ↓
Output
```

For ChatGPT:

```
User Prompt
      ↓
GPT Model
      ↓
Generated Response
```

---

# Understanding with a Car Analogy

The instructor explained ChatGPT using the example of a car.

A car has two major parts.

## Part 1 — Car Body

This includes:

* Design
* Steering
* Wheels
* Seats
* Dashboard
* Lights
* Doors
* User Interface

This is the part that users interact with.

Think of this as the **application**.

---

## Part 2 — Engine

The engine is hidden inside the car.

It contains many complex components:

* Pistons
* Fuel Injection
* Air Intake
* Combustion Chamber
* Gearbox
* Cooling System

The engine converts fuel into motion.

Without the engine, the car cannot move.

---

## Mapping this to AI

| Car      | AI World            |
| -------- | ------------------- |
| Car Body | ChatGPT Application |
| Engine   | GPT / LLM           |
| Driver   | User                |
| Fuel     | Prompt              |
| Movement | Generated Response  |

---

## Application Engineer vs ML Engineer

There are two types of engineers involved.

### Machine Learning Engineer

Builds:

* Neural networks
* Transformers
* Training pipelines
* Datasets
* Optimization algorithms

This corresponds to the **engine**.

---

### Application Engineer

Builds:

* Websites
* Chatbots
* AI assistants
* Productivity tools
* Mobile apps

Uses an already-trained LLM.

This corresponds to the **car body**.

---

## What Will We Learn?

This course focuses on becoming an **Application Engineer**.

We will **use** existing LLMs through APIs rather than training our own models.

---

# What is an LLM?

LLM stands for:

> **Large Language Model**

An LLM is a deep learning model trained on enormous amounts of text to understand and generate human language.

Examples include:

* GPT
* Gemini
* Claude
* Llama

LLMs predict the **next token** in a sequence.

---

# GPT vs ChatGPT

Many beginners confuse these terms.

## GPT

GPT is the AI model (the engine).

GPT stands for:

> **Generative Pre-trained Transformer**

---

### Generative

Able to generate new content.

Examples:

* Text
* Code
* Stories
* Answers

---

### Pre-trained

The model is trained beforehand on massive datasets.

Instead of learning from scratch every time, it already possesses general knowledge.

---

### Transformer

The neural network architecture used by GPT.

It processes text using attention mechanisms.

---

## ChatGPT

ChatGPT is the complete application.

It includes:

* User interface
* Conversation management
* Memory (where available)
* Safety systems
* GPT model underneath

Simply put:

```
GPT = Engine

ChatGPT = Complete Car
```

---

# First Mover Advantage

OpenAI was one of the earliest companies to make powerful LLMs accessible to the public.

Being an early mover gave them:

* Huge user adoption
* Large developer ecosystem
* Brand recognition
* Continuous improvements through feedback

Today, many competitors exist, but OpenAI gained a significant advantage by reaching users first.

---

# What is a Transformer?

A Transformer is the deep learning architecture that powers modern LLMs.

The paper **"Attention Is All You Need"**, published by Google researchers in 2017, introduced the Transformer architecture and transformed the field of Natural Language Processing.

The key idea is that the model uses **attention** to understand relationships between words in a sentence.

---

# How a Transformer Generates Text

An LLM generates text one token at a time.

Example:

```
Input

123

↓

Model predicts

4

↓

Output

1234
```

Next iteration:

```
1234

↓

Predict

5

↓

12345
```

This process repeats until the model decides to stop.

---

## Example

Prompt:

```
Tell me about myself.
```

Internally, generation may look like:

```
Sure

↓

Sure, you

↓

Sure, you are

↓

Sure, you are Aminul

↓

Sure, you are Aminul, a CSE student

↓

Sure, you are Aminul, a CSE student learning technology...
```

The response is generated token by token until the full answer is complete.

---

# How Computers Understand Language

Computers do **not** understand words directly.

They understand **numbers**.

Every word must first be converted into numerical representations.

---

# Tokens

A **token** is the smallest unit of text that an LLM processes.

A token can be:

* A whole word
* Part of a word
* A punctuation mark
* A number
* A symbol

Example:

```
Hello

↓

May become

[15496]
```

Longer words are often split into multiple tokens.

---

# LLM Vocabulary

Each LLM has its own predefined vocabulary.

This vocabulary maps text fragments to token IDs.

Illustrative example:

```
A → 1

B → 9

The → 209

Hello → 15496
```

These IDs are fixed for a given tokenizer.

Different models (GPT, Llama, Gemini, etc.) may use different tokenization schemes and vocabularies.

---

# Step 1 — Tokenization

Tokenization is the process of converting natural language into tokens.

Example sentence:

```
Hello, I am Aminul
```

Illustrative tokenization:

```
Hello → 132255

I → 11

am → 357

Ami → 19087

nul → 9378
```

The exact token IDs depend on the tokenizer being used.

---

## Example using `tiktoken`

```javascript
import { get_encoding } from "tiktoken";

const encoder = get_encoding("gpt2");

const encoded = encoder.encode("Hello, I am Piyush");

console.log(encoded);

const decoded = encoder.decode(encoded);

console.log(new TextDecoder().decode(decoded));
```

### Explanation

* `get_encoding("gpt2")` loads the GPT-2 tokenizer.
* `encode()` converts text into token IDs.
* `decode()` converts token IDs back into text.

---

## How Tokenization Works: Byte-Pair Encoding (BPE)

Tokenization algorithms aren't arbitrary rules. Modern LLMs (like GPT and Llama) use an algorithm called **Byte-Pair Encoding (BPE)** to construct their vocabulary and split text.

### The BPE Algorithm Steps:
1. **Initialize the Vocabulary**: Treat every unique character/byte in the training corpus as a base token.
2. **Count Co-occurrences**: Count all adjacent pairs of tokens in the corpus.
3. **Merge the Most Frequent Pair**: Find the most frequent adjacent pair of tokens (e.g., `'t'` and `'h'`) and merge them into a single new token (e.g., `'th'`).
4. **Repeat**: Repeat steps 2 and 3 iteratively until the target vocabulary size is reached (e.g., 50,000 or 100,000 tokens).

Through this recursive merging, BPE naturally keeps common words as single tokens (e.g., `the`, `and`) while splitting rare words or new terminology into sub-word chunks (e.g., `tokenization` -> `token` + `ization`).

---

## Tokenizer Model Comparisons

Not all tokenizers are built equal. As LLMs have evolved, their tokenization strategies and vocabulary sizes have drastically changed to become more efficient:

| Tokenizer Name | Primarily Used By | Vocabulary Size | Characteristics & Key Improvements |
| :--- | :--- | :--- | :--- |
| **`gpt2`** | GPT-2 | ~50,257 | Early BPE implementation. Very basic split rules. |
| **`cl100k_base`** | GPT-3.5-Turbo, GPT-4 | ~100,000 | Larger vocabulary. Highly optimized for handling source code, whitespace, and special characters. |
| **`o200k_base`** | GPT-4o, GPT-4o-mini | ~200,000 | Massive vocabulary. Significantly reduces the "token tax" for non-English languages, and handles numbers/dates better. |

### The Multilingual "Token Tax"
In older tokenizers (like `gpt2` or `cl100k_base`), non-English characters (e.g., Spanish accents, Hindi script, Bengali script) often split into multiple tokens—sometimes 3 or 4 tokens for a single character! This increases costs and reduces the effective context window size for non-English prompts.

Modern tokenizers like `o200k_base` resolve this by expanding the vocabulary to include common character combinations of non-Latin alphabets, leading to a much lower token count for the exact same text.

---

# Step 2 — Embeddings

After tokenization, token IDs are transformed into **embeddings**.

An embedding is a dense vector of numbers that captures the semantic meaning of a token.

Words with similar meanings have embeddings that are close together in the vector space.

Example relationships:

```
Eiffel Tower ↔ Paris

Statue of Liberty ↔ USA
```

Even though "Eiffel Tower" and "Paris" are different words, their embeddings reflect a strong semantic relationship.

---

## Vector Space Intuition

Imagine every token as a point in a very high-dimensional space.

Semantically related concepts cluster together.

For example:

```
Paris
France
London
Berlin
```

form one region, while:

```
Apple
Banana
Orange
Mango
```

form another.

The model learns these relationships during training.

---

# Step 3 — Positional Encoding

Transformers process all tokens in parallel.

Unlike humans, they do not inherently know the order of words.

Positional encoding provides information about each token's position in the sequence.

Consider these sentences:

```
Aminul loves ice cream.
```

and

```
Ice cream loves Aminul.
```

They contain the same words but convey different meanings because the order is different.

Positional encoding allows the model to distinguish between these sequences.

---

# Step 4 — Self-Attention

Self-attention is the core mechanism of the Transformer.

Each token examines every other token in the sequence to determine which ones are most relevant.

For example:

```
I deposited money in the bank.
```

Here, "bank" refers to a financial institution.

```
The boat reached the river bank.
```

In this case, "bank" refers to the side of a river.

Self-attention uses surrounding context to infer the correct meaning.

---

## Single-Head and Multi-Head Attention

A **single-head attention** mechanism learns one type of relationship.

A **multi-head attention** mechanism uses several attention heads simultaneously, allowing the model to capture different kinds of relationships (e.g., syntax, semantics, long-range dependencies) at the same time.

---

# Step 5 — Feed Forward Network

After attention, each token passes through a feed-forward neural network.

This network performs further transformations on the token representations, helping the model learn more complex patterns before producing the final prediction.

---

# Softmax

The model produces a score (logit) for every possible next token.

Softmax converts these scores into probabilities that sum to 1.

The token with the highest probability is typically selected, though sampling strategies may choose others.

---

# Temperature

Temperature controls the randomness of the model's output.

* **Low Temperature (e.g., 0.2):** More deterministic and focused.
* **Medium Temperature (e.g., 0.7):** Balanced creativity.
* **High Temperature (e.g., 1.2):** More diverse and creative, but potentially less consistent.

---

# Top-p (Nucleus Sampling)

Instead of considering all possible tokens, Top-p limits sampling to the smallest set of tokens whose cumulative probability exceeds a threshold (e.g., 0.9).

This often produces more coherent responses than unrestricted sampling.

---

# Training Phase vs Inference Phase

## Training Phase

During training, the model:

* Reads massive datasets
* Learns language patterns
* Updates billions of parameters
* Minimizes prediction errors using optimization algorithms

This process is computationally intensive and performed once by model creators.

---

## Inference Phase

Inference is what happens when you use ChatGPT.

The model:

* Receives your prompt
* Tokenizes it
* Computes embeddings
* Applies attention and feed-forward layers
* Predicts the next token repeatedly until the response is complete

No learning occurs during inference.

---

# Labels

During training, the correct next token is called the **label** or **ground truth**.

The model compares its prediction with the label to measure how accurate it was.

---

# Cross-Entropy Loss

Cross-entropy is the loss function commonly used for language models.

It measures the difference between the model's predicted probability distribution and the true target distribution.

A lower cross-entropy indicates that the model's predictions are closer to the correct answers.

---

# Context Window

An LLM can only consider a limited number of tokens at once.

This limit is called the **context window**.

The context window includes:

* Your prompt
* Conversation history
* The model's generated response

If the total exceeds the model's limit, older tokens are truncated, meaning the model can no longer "see" them.

---

# Calling GPT with the OpenAI SDK

```javascript
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.chat.completions
  .create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Hello, How are you?",
      },
    ],
  })
  .then((response) => {
    console.log(response.choices[0].message.content);
  });
```

### Explanation

1. Import the `OpenAI` client.
2. Create a client using your API key.
3. Specify the model to use.
4. Provide the conversation as an array of messages.
5. Receive and print the generated response.

---

## Managing API Keys Safely

Never hardcode your API keys inside your code files. Hardcoded secrets are easily leaked when publishing or committing code to Git.

### Modern Node.js Native `.env` Loading
Starting in **Node.js v20.6.0**, Node has native support for reading `.env` files without installing a third-party package like `dotenv`.

1. Create a file named `.env` in the root of your project:
   ```env
   OPENAI_API_KEY=your-actual-api-key-here
   ```
2. Run your application with the `--env-file` flag:
   ```bash
   node --env-file=.env index.js
   ```
3. Inside your JavaScript files, the environment variables will be available on `process.env`:
   ```javascript
   console.log(process.env.OPENAI_API_KEY);
   ```

---

# Beyond OpenAI: Groq, Gemini, and Mistral

While OpenAI is the industry leader, the AI ecosystem has several other powerful platforms. As an Application Engineer, you should choose the model that fits your latency, cost, and context window requirements.

## 1. Google Gemini
* **Strength**: Gemini models are famous for their **massive context windows** (up to 2 million tokens in Gemini 1.5/2.0) and strong **native multimodality** (it was built from the ground up to understand text, images, audio, and video concurrently).
* **SDK**: `@google/genai` (Google's modern SDK)
* **Key Model**: `gemini-2.5-flash` or `gemini-1.5-flash`

## 2. Groq
* **Strength**: Groq does not use traditional GPUs. Instead, it uses custom **LPU (Language Processing Unit)** hardware, achieving blazing fast inference speeds (often >500 tokens/sec for Llama 3 models). It is ideal for real-time applications requiring instant responses.
* **SDK**: `groq-sdk`
* **Key Model**: `llama3-8b-8192` or `llama-3.3-70b-versatile`

## 3. Mistral AI
* **Strength**: A leading European AI company championing **open-weights** models. They offer competitive commercial APIs and also allow developers to download and host the models locally.
* **SDK**: `@mistralai/mistralai`
* **Key Model**: `mistral-large-latest` or `open-mistral-7b`

---

## Developer Comparison Table

| Feature | OpenAI | Google Gemini | Groq | Mistral AI |
| :--- | :--- | :--- | :--- | :--- |
| **Official NPM Package** | `openai` | `@google/genai` | `groq-sdk` | `@mistralai/mistralai` |
| **Env Variable Key** | `OPENAI_API_KEY` | `GEMINI_API_KEY` | `GROQ_API_KEY` | `MISTRAL_API_KEY` |
| **Default Client Import** | `import { OpenAI } from "openai"` | `import { GoogleGenAI } from "@google/genai"` | `import Groq from "groq-sdk"` | `import { Mistral } from "@mistralai/mistralai"` |
| **Primary Model Used** | `gpt-4o-mini` | `gemini-2.5-flash` | `llama-3.3-70b-versatile` | `mistral-large-latest` |

---

# Summary

In this session, we learned:

* Introduction to Chaicode and the Gen AI JS Cohort
* What Artificial Intelligence and Generative AI are
* The difference between GPT (engine) and ChatGPT (application)
* The car analogy for understanding AI systems
* What an LLM is and what GPT stands for
* How Transformers generate text one token at a time
* The role of tokenization, embeddings, positional encoding, self-attention, and feed-forward networks
* How Softmax, Temperature, and Top-p influence token generation
* The distinction between training and inference
* The purpose of labels and cross-entropy loss during training
* What a context window is and why it matters
* How to interact with an LLM using the OpenAI JavaScript SDK

These concepts form the foundation for understanding how modern large language models work internally and prepare you for building Generative AI applications in JavaScript throughout the rest of the course.
