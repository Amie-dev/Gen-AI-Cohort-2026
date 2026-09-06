# Chapter 07 — Asynchronous Ingestion Queue & Background Worker

## 1. Chapter Goal

The goal of this chapter is to build the background document ingestion queue and worker process in [`src/queues/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/queues/).

Parsing large PDF documents, slicing them into overlapping text chunks, generating vector embeddings via OpenAI, and writing point records to Qdrant is computationally heavy.

By delegating document processing to a **BullMQ Background Queue**:
1. The API endpoint (`POST /index`) instantly returns `HTTP 202 Accepted` with a `jobId`.
2. The **Indexing Worker** runs independently in a separate background thread, consuming queued jobs without blocking API request threads.

```text
HTTP Client
    │
    ▼ POST /index (PDF File)
Express REST Server
    │
    └─► enqueueIndexingJob() ──► [ Redis: adv-rag-indexing Queue ]
                                              │
                                              ▼
                                    indexingWorker (Worker Process)
                                              │
                                              ├─► Read PDF via pdf-parse
                                              ├─► Boundary Chunker (1000 size / 200 overlap)
                                              ├─► Batch Embeddings (text-embedding-3-small)
                                              └─► Upsert Points into Qdrant Collection
```

---

## 2. BullMQ Queue Configuration (`src/queues/indexingQueue.js`)

Create [`src/queues/indexingQueue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/queues/indexingQueue.js):

```javascript
import { Queue } from "bullmq";
import { redisConnection } from "../db/redis.js";
import { INDEXING_QUEUE, QUERY_QUEUE } from "../config.js";

export const indexingQueue = new Queue(INDEXING_QUEUE, { connection: redisConnection });
export const queryQueue = new Queue(QUERY_QUEUE, { connection: redisConnection });

export async function enqueueIndexingJob(filePath, originalName) {
  return indexingQueue.add(
    "index-document",
    { filePath, originalName },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}

export async function enqueueQueryJob(userQuery, user) {
  return queryQueue.add(
    "run-rag-query",
    { userQuery, user },
    {
      attempts: 2,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 3600, count: 1000 },
    }
  );
}
```

---

## 3. Background PDF Indexing & Query Worker (`src/queues/indexingWorker.js`)

Create [`src/queues/indexingWorker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/queues/indexingWorker.js):

```javascript
import { Worker } from "bullmq";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import OpenAI from "openai";
import { redisConnection } from "../db/redis.js";
import { INDEXING_QUEUE, QUERY_QUEUE, config } from "../config.js";
import { qdrant, ensureCollection } from "../db/qdrant.js";
import { productionRAG } from "../rag/ragPipeline.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Text Chunking with word-boundary awareness
 */
function chunkText(text, chunkSize = config.chunking.chunkSize, overlap = config.chunking.chunkOverlap) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);

    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

// 1. Indexing Worker Process
export const indexingWorker = new Worker(
  INDEXING_QUEUE,
  async (job) => {
    const { filePath, originalName } = job.data;
    console.log(`📥 [Worker] Processing Indexing Job ${job.id}: ${originalName}`);

    const collection = await ensureCollection();
    const buffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(buffer);
    const chunks = chunkText(pdfData.text);

    if (chunks.length === 0) {
      return { indexed: 0, message: "No extractable text found in PDF" };
    }

    // Embed in batch
    const embRes = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: chunks,
    });

    const points = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      vector: embRes.data[i].embedding,
      payload: {
        text: chunk,
        source: originalName,
        filePath,
        chunkIndex: i,
        tenantId: "default",
        accessLevel: 1,
      },
    }));

    await qdrant.upsert(collection, { wait: true, points });
    console.log(`   → ${chunks.length} chunk(s) indexed into Qdrant collection "${collection}"`);

    return { indexed: chunks.length, collection };
  },
  { connection: redisConnection, concurrency: 2 }
);

// 2. Query Worker Process
export const queryWorker = new Worker(
  QUERY_QUEUE,
  async (job) => {
    const { userQuery, user } = job.data;
    console.log(`🔎 [Worker] Processing Async Query Job ${job.id}: "${userQuery}"`);

    const result = await productionRAG(userQuery, user);
    return result;
  },
  { connection: redisConnection, concurrency: 4 }
);

for (const [name, worker] of [
  ["indexing", indexingWorker],
  ["query", queryWorker],
]) {
  worker.on("completed", (job) => console.log(`✅ [${name}] Job ${job.id} completed successfully`));
  worker.on("failed", (job, err) => console.error(`❌ [${name}] Job ${job?.id} failed:`, err.message));
}

console.log("👷 Production RAG Background Workers started (indexing + query). Waiting for queue jobs...");
```

---

## 4. Running the Worker

Start the worker process independently:

```bash
npm run worker
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `indexingQueue` & `queryQueue`: BullMQ Redis queues for indexing documents and running queries asynchronously.
- `indexingWorker` & `queryWorker`: Background workers for PDF processing/indexing and async RAG execution.

In [**Chapter 08 — Express REST API & Terminal CLI Shell**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-08-api-server-cli.md), we will build the Express REST API endpoints and interactive CLI shell.
