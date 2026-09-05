# Chapter 07 — Asynchronous Ingestion Queue & Background Worker

## 1. Chapter Goal

The goal of this chapter is to build the background job ingestion subsystem in [`src/queues/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/).

Parsing large PDF documents and generating embeddings can take 10-30 seconds. Performing this synchronously during an HTTP upload request freezes the client socket.

By using **BullMQ + Redis**:
1. `POST /api/rag/index-pdf` enqueues an `indexing-pdf-job` into Redis and immediately returns `HTTP 202 Accepted` with a `jobId`.
2. `indexingWorker.js` runs in a separate background process, picking up jobs, reading PDFs, chunking text, generating embeddings, and upserting points into Qdrant.

```text
HTTP Client
    │
    ▼ POST /api/rag/index-pdf
Express Server (server.js)
    │
    └─► addIndexingJob() ──► [ Redis Queue: adv_rag_1_pdf_indexing ]
                                             │
                                             ▼
                                  indexingWorker (src/queues/indexingWorker.js)
                                             │
                                             ├─► readPdfText() via pdf-parse
                                             ├─► chunkText() (1000 size / 200 overlap)
                                             ├─► generate embeddings via OpenAI
                                             └─► qdrant.upsert(points)
```

---

## 2. BullMQ Producer Queue (`src/queues/indexingQueue.js`)

Create [`src/queues/indexingQueue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/indexingQueue.js):

```javascript
import { Queue } from 'bullmq';
import { redisConnection } from '../db/redis.js';

export const QUEUE_NAME = 'adv_rag_1_pdf_indexing';
export const indexingQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

export async function addIndexingJob(fileData) {
  return await indexingQueue.add('indexing-pdf-job', fileData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
```

---

## 3. Background PDF Indexing Worker (`src/queues/indexingWorker.js`)

Create [`src/queues/indexingWorker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/indexingWorker.js):

```javascript
import { Worker } from 'bullmq';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { redisConnection } from '../db/redis.js';
import { qdrant, collectionName, ensureCollection } from '../db/qdrant.js';
import { QUEUE_NAME } from './indexingQueue.js';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey });
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(' ', end);
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
  QUEUE_NAME,
  async (job) => {
    console.log(`📥 [Indexing Worker] Processing Job ${job.id}: ${job.data.originalName}`);

    await ensureCollection();
    const buffer = await fs.readFile(job.data.filePath);
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return { chunks: 0, message: 'No extractable text found in PDF.' };
    }

    let vectors = [];
    if (openai) {
      const embeddingRes = await openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: chunks,
      });
      vectors = embeddingRes.data.map((item) => item.embedding);
    } else {
      // Mock vector fallback for offline execution
      vectors = chunks.map(() => new Array(1536).fill(0.01));
    }

    const points = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      vector: vectors[i],
      payload: {
        text: chunk,
        source: job.data.originalName,
        chunkIndex: i,
        tenantId: 'tenant_1',
        accessLevel: 5,
      },
    }));

    await qdrant.upsert(collectionName, { wait: true, points });
    console.log(`✅ Indexed ${chunks.length} chunks into Qdrant collection "${collectionName}".`);

    return { chunks: chunks.length, collection: collectionName };
  },
  { connection: redisConnection, concurrency: 2 }
);

indexingWorker.on('completed', (job) => console.log(`✅ Indexing Job ${job.id} completed.`));
indexingWorker.on('failed', (job, err) => console.error(`❌ Indexing Job ${job?.id} failed:`, err.message));

console.log('👷 Background Indexing Worker process started...');
```

---

## 4. Running the Worker Process

To launch the indexing worker independently:

```bash
npm run worker
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `indexingQueue.js`: BullMQ Redis queue configuration with exponential backoff retries.
- `indexingWorker.js`: Asynchronous background worker parsing PDFs, creating text chunks, generating vector embeddings, and writing points to Qdrant.

In [**Chapter 08 — Express REST API Server & Endpoint Testing**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-08-express-server-api.md), we will build the Express REST API endpoints and verify the full system using cURL.
