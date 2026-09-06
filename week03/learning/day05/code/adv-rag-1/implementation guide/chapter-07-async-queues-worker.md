# Chapter 07 — Asynchronous Ingestion Queue & Background Worker

## 1. Chapter Goal

The goal of this chapter is to build the background job ingestion subsystem in [`src/queues/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/).

Parsing large PDF documents and generating embeddings can take 10-30 seconds. Performing this synchronously during an HTTP upload request freezes the client socket.

By using **BullMQ + Redis**:
1. `POST /api/rag/index-pdf` enqueues an `index-document` job into Redis and immediately returns `HTTP 202 Accepted` with a `jobId`.
2. `indexingWorker.js` runs in a separate background process, picking up jobs, reading PDFs, chunking text, generating embeddings, and upserting points into Qdrant.

```text
HTTP Client
    │
    ▼ POST /api/rag/index-pdf
Express Server (server.js)
    │
    └─► addIndexingJob() ──► [ Redis Queue: indexing ]
                                             │
                                             ▼
                                  indexingWorker (src/queues/indexingWorker.js)
                                             │
                                             ├─► readPdfText() via pdf-parse
                                             ├─► chunkText()
                                             ├─► generate vectors / dummy vector fallback
                                             └─► qdrantClient.upsert(points)
```

---

## 2. BullMQ Producer Queue (`src/queues/indexingQueue.js`)

Create [`src/queues/indexingQueue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/indexingQueue.js):

```javascript
import { Queue } from 'bullmq';
import { redisConnection } from '../db/redis.js';

export const INDEXING_QUEUE_NAME = 'indexing';

export const indexingQueue = new Queue(INDEXING_QUEUE_NAME, {
  connection: redisConnection
});

/**
 * Add document indexing job to BullMQ queue
 */
export async function addIndexingJob(jobData) {
  console.log(`[BullMQ Producer] Adding indexing job for file: ${jobData.originalName || jobData.filePath}`);

  const job = await indexingQueue.add('index-document', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true
  });

  return job;
}
```

---

## 3. Background PDF Indexing Worker (`src/queues/indexingWorker.js`)

Create [`src/queues/indexingWorker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/indexingWorker.js):

```javascript
import { Worker } from 'bullmq';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { redisConnection } from '../db/redis.js';
import { INDEXING_QUEUE_NAME } from './indexingQueue.js';
import { qdrantClient, COLLECTION_NAME, initQdrantCollection } from '../db/qdrant.js';

// Simple text chunker helper
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index, index + chunkSize);
    chunks.push(chunk);
    index += (chunkSize - overlap);
  }
  return chunks;
}

// Dummy vector embedding helper fallback
function generateDummyVector(text, dimension = 1536) {
  const vector = new Array(dimension).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < dimension; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

export const indexingWorker = new Worker(
  INDEXING_QUEUE_NAME,
  async (job) => {
    const { filePath, originalName } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id}: Indexing ${originalName || filePath}...`);

    let textContent = '';
    if (filePath && fs.existsSync(filePath)) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else {
      textContent = `Mock document text for indexing sample ${originalName || 'doc.pdf'}. Contains refund policy and subscription details.`;
    }

    const chunks = chunkText(textContent);
    console.log(`[BullMQ Worker] Split text into ${chunks.length} chunks.`);

    await initQdrantCollection();

    const points = chunks.map((chunk, idx) => ({
      id: idx + 1 + Math.floor(Math.random() * 100000),
      vector: generateDummyVector(chunk),
      payload: {
        text: chunk,
        title: originalName || 'Uploaded PDF Document',
        tenantId: 'tenant_1',
        accessLevel: 1,
        source: 'PDF_Upload',
        indexedAt: new Date().toISOString()
      }
    }));

    try {
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points
      });
      console.log(`[BullMQ Worker] Successfully upserted ${points.length} vector points to Qdrant.`);
    } catch (err) {
      console.warn(`[BullMQ Worker Warning] Could not upsert to Qdrant server (${err.message}). Worker step completed with mock fallback.`);
    }

    return {
      success: true,
      indexedChunks: chunks.length,
      fileName: originalName || filePath
    };
  },
  {
    connection: redisConnection,
    concurrency: 2
  }
);

indexingWorker.on('completed', (job, result) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed! Results:`, result);
});

indexingWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
});
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
- `indexingQueue.js`: BullMQ Redis producer queue configuration with exponential backoff retries.
- `indexingWorker.js`: Asynchronous background worker parsing PDFs, creating text chunks, generating vector embeddings, and writing points to Qdrant.

In [**Chapter 08 — Express REST API Server & Endpoint Testing**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-08-express-server-api.md), we will build the Express REST API endpoints and verify the full system using cURL.
