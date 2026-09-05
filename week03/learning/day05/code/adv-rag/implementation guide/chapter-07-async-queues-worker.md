# Chapter 07 — Asynchronous Ingestion Queue & Background Worker

## 1. Chapter Goal

The goal of this chapter is to build the background document ingestion queue and worker process in [`src/queues/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/queues/).

Parsing large PDF documents, slicing them into overlapping text chunks, generating vector embeddings via OpenAI, and writing point records to Qdrant is computationally heavy.

By delegating document processing to a **BullMQ Background Queue**:
1. The API endpoint (`POST /api/rag/index`) instantly returns `HTTP 202 Accepted` with a `jobId`.
2. The **Indexing Worker** runs independently in a separate background thread, consuming queued jobs without blocking API request threads.

```text
HTTP Client
    │
    ▼ POST /api/rag/index (PDF File)
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
import { INDEXING_QUEUE } from "../config.js";

export const indexingQueue = new Queue(INDEXING_QUEUE, {
  connection: redisConnection,
});

export async function enqueueIndexingJob(filePayload) {
  return await indexingQueue.add("index-document", filePayload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
```

---

## 3. Background PDF Indexing Worker (`src/queues/indexingWorker.js`)

Create [`src/queues/indexingWorker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/queues/indexingWorker.js):

```javascript
import { Worker } from "bullmq";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import OpenAI from "openai";
import { redisConnection } from "../db/redis.js";
import { config, INDEXING_QUEUE } from "../config.js";
import { qdrant, ensureCollection } from "../db/qdrant.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

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

export const indexingWorker = new Worker(
  INDEXING_QUEUE,
  async (job) => {
    console.log(`📥 [Indexing Worker] Processing job ${job.id}: ${job.data.originalName}`);

    const collectionName = await ensureCollection();
    const buffer = await fs.readFile(job.data.filePath);
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || "";

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return { chunks: 0, message: "No extractable text found in PDF." };
    }

    // Generate batch vector embeddings via OpenAI
    const batchRes = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: chunks,
    });

    const vectors = batchRes.data.map((item) => item.embedding);

    const points = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      vector: vectors[i],
      payload: {
        text: chunk,
        source: job.data.originalName,
        chunkIndex: i,
        tenantId: job.data.tenantId || "default",
        accessLevel: job.data.accessLevel || 1,
      },
    }));

    await qdrant.upsert(collectionName, { wait: true, points });
    console.log(`✅ [Indexing Worker] Successfully indexed ${chunks.length} chunk(s) into Qdrant.`);

    return { chunks: chunks.length, collection: collectionName };
  },
  { connection: redisConnection, concurrency: 2 }
);

indexingWorker.on("completed", (job) => console.log(`✅ Job ${job.id} completed.`));
indexingWorker.on("failed", (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));

console.log("👷 Indexing worker running...");
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
- `indexingQueue`: BullMQ Redis queue with exponential retry backoffs.
- `indexingWorker`: Asynchronous PDF parser, chunker, batch embedder, and Qdrant upsert worker.

In [**Chapter 08 — Express REST API & Terminal CLI Shell**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-08-api-server-cli.md), we will build the Express REST API endpoints and interactive CLI shell.
