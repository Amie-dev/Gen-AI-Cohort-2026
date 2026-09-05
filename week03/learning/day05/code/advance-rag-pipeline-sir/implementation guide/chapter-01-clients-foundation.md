# Chapter 01 — Core Clients & Foundations (OpenAI & Qdrant)

## 1. Chapter Goal

The goal of this chapter is to build the core foundation clients for our external AI and Vector DB services:
1. **OpenAI Client Integration (`src/openai.js`)**: Configures the OpenAI SDK for generating text embeddings (`text-embedding-3-small`) and batch vector generation.
2. **Qdrant Vector Database Integration (`src/qdrant.js`)**: Connects to the Qdrant REST API and implements automatic collection initialization with dimension validation and race-condition guardrails.

### 🎯 Expected Outcome

By the end of this chapter, you will have two clean foundation modules:

```text
src/
├── openai.js      # Shared OpenAI SDK instance, embedText(), embedTexts()
└── qdrant.js      # Shared QdrantClient instance, ensureCollection()
```

The interaction flow for these client libraries works as follows:

```text
      +--------------------------------------------------------+
      |                      src/config.js                     |
      +---------------------------+----------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|     src/openai.js     |                   |     src/qdrant.js     |
+-----------------------+                   +-----------------------+
| • shared OpenAI client|                   | • QdrantClient instance|
| • embedText(single)   |                   | • ensureCollection()  |
| • embedTexts(batch)   |                   |   (Create collection  |
+-----------+-----------+                   |    if not present)    |
            |                               +-----------+-----------+
            v                                           v
+-----------------------+                   +-----------------------+
|  OpenAI API Endpoint  |                   |   Qdrant Vector DB    |
| (embeddings / chat)   |                   |  (http://127.0.0.1:6333|
+-----------------------+                   +-----------------------+
```

---

## 2. OpenAI Client & Embedding Helpers (`src/openai.js`)

Generating embeddings efficiently requires both single-string encoding and **batched vector generation** to minimize network overhead and stay well within API token rate limits.

Create [`src/openai.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/openai.js):

```javascript
import OpenAI from "openai";
import { config } from "./config.js";

// Shared OpenAI client used for both embeddings and chat completions.
export const openai = new OpenAI({ apiKey: config.openai.apiKey });

/** Create an embedding vector for a single piece of text. */
export async function embedText(text) {
  const res = await openai.embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
  });
  return res.data[0].embedding;
}

/** Create embeddings for many texts (batched to stay within limits). */
export async function embedTexts(texts, batchSize = 100) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: batch,
    });
    for (const item of res.data) vectors.push(item.embedding);
  }
  return vectors;
}
```

### Key Technical Rationale

#### 1. Single vs. Batched Embeddings
- `embedText(text)`: Used during runtime query processing when a single user question needs to be converted into a 1536-dimensional vector.
- `embedTexts(texts, batchSize)`: Used during PDF indexing. When a large PDF is split into 100+ text chunks, sending chunks individually creates 100 sequential HTTP requests. `embedTexts` chunks the array into batches of 100 strings per single API payload, reducing network latency by over 90%.

#### 2. Vector Model & Dimensions
We default to `text-embedding-3-small`, which produces high-density vectors with **1536 floating-point dimensions**. The vector dimension count must exactly match the dimension parameter configured in Qdrant.

---

## 3. Qdrant Client & Collection Auto-Provisioning (`src/qdrant.js`)

Qdrant requires a collection to exist with a defined vector metric (e.g. `Cosine` or `Euclidean`) and vector size before upserting points.

Create [`src/qdrant.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/qdrant.js):

```javascript
import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "./config.js";

export const qdrant = new QdrantClient({ url: config.qdrant.url });

/**
 * Create the collection if it doesn't already exist.
 * Vector size must match the embedding model's dimensions.
 */
export async function ensureCollection() {
  const name = config.qdrant.collection;
  const exists = await qdrant.collectionExists(name);

  if (!exists.exists) {
    try {
      await qdrant.createCollection(name, {
        vectors: {
          size: config.openai.embeddingDimensions,
          distance: "Cosine",
        },
      });
      console.log(`🗂️  Created Qdrant collection "${name}"`);
    } catch (err) {
      // Another concurrent worker may have created it first (409 Conflict).
      const stillMissing = !(await qdrant.collectionExists(name)).exists;
      if (stillMissing) throw err;
    }
  }

  return name;
}
```

### Key Technical Rationale

#### 1. Distance Metric Selection (`Cosine`)
We use `Cosine` distance, which measures the angle between normalized embedding vectors. Cosine similarity works best for text semantic similarity because vector magnitude (text length) is normalized out.

```text
Cosine Distance Formula:
           A · B
cos(θ) = ─────────
         ‖A‖ × ‖B‖
```

#### 2. Concurrency Control & Race Condition Protection
When multiple BullMQ indexing workers spin up concurrently in parallel threads, two workers might simultaneously check `collectionExists(name)` and see `false`. Both workers will attempt `createCollection(name)`.
- Worker 1 succeeds.
- Worker 2 receives an HTTP `409 Conflict` error from Qdrant.
- The `try...catch` block gracefully catches the error, re-verifies if the collection exists, and avoids crashing the indexing job.

---

## 4. Summary & Next Steps

In this chapter, we implemented:
- `src/openai.js`: Centralized OpenAI SDK instance with batched vector embedding generation (`embedTexts`).
- `src/qdrant.js`: Qdrant REST client and collection auto-creation with concurrent collision handling.

In [**Chapter 02 — Asynchronous Queue System**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-02-queue-infrastructure.md), we will build the BullMQ + Redis job queues that decouple HTTP request handling from background worker processing.
