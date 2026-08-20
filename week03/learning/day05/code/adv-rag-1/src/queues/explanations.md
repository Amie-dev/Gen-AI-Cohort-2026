# `src/queues/` Directory Explanations

## Overview
The `src/queues/` directory implements background asynchronous processing using **BullMQ** and **Redis**.

In production RAG systems, document ingestion (parsing PDFs, extracting raw text, sliding-window chunking, generating 1536-dimensional embeddings, and storing vector points in Qdrant) is computationally heavy and network-bound. Running ingestion synchronously inside an API request would block the web server event loop and trigger client HTTP timeouts.

---

## Queue Architecture & Workflow

```
[ Express API Server ] ──► [ indexingQueue.add() ]
                                   │
                                   ▼
                         [ Redis Queue Store ]
                                   │
                                   ▼
[ indexingWorker Thread ] ◄── (Pulls Job Async)
       │
       ├──► 1. Parse PDF file Buffer (pdf-parse)
       ├──► 2. Sliding Window Text Chunking (chunkSize=500, overlap=50)
       ├──► 3. Generate High-Dimensional Embeddings
       └──► 4. Upsert Vector Points into Qdrant Collection
```

---

## File Explanations & Code / Pseudocode

### 1. Queue Producer (`indexingQueue.js`)
Initializes the BullMQ Queue instance and exposes standard methods to enqueue document processing jobs.

```javascript
/**
 * BullMQ Job Producer Pseudocode
 */
import { Queue } from 'bullmq';
import { redisConnection } from '../db/redis.js';

export const INDEXING_QUEUE_NAME = 'indexing';
export const indexingQueue = new Queue(INDEXING_QUEUE_NAME, { connection: redisConnection });

export async function addIndexingJob(jobData) {
  // Add job with 3 retry attempts and exponential backoff
  return await indexingQueue.add('index-document', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s, 4s, 8s retries
    },
    removeOnComplete: true
  });
}
```

---

### 2. Background Worker (`indexingWorker.js`)
Pulls jobs from Redis, extracts text, chunks document contents, generates vector embeddings, and upserts payload points into Qdrant.

```javascript
/**
 * BullMQ Worker Processing Pseudocode
 */
import { Worker } from 'bullmq';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { qdrantClient, COLLECTION_NAME, initQdrantCollection } from '../db/qdrant.js';

// Sliding Window Chunker
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += (chunkSize - overlap);
  }
  return chunks;
}

export const indexingWorker = new Worker(
  'indexing',
  async (job) => {
    const { filePath, originalName } = job.data;

    // Step 1: Read PDF buffer & extract raw text
    let textContent = '';
    if (filePath && fs.existsSync(filePath)) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    }

    // Step 2: Split text into overlapping chunks
    const chunks = chunkText(textContent, 500, 50);

    // Step 3: Ensure vector collection is ready
    await initQdrantCollection();

    // Step 4: Map chunks to vector payload points
    const points = chunks.map((chunk, idx) => ({
      id: idx + 1 + Math.floor(Math.random() * 100000),
      vector: generateEmbeddingVector(chunk), // 1536-dim vector
      payload: {
        text: chunk,
        title: originalName || 'PDF Document',
        tenantId: 'tenant_1',
        accessLevel: 1,
        source: 'PDF_Upload',
        indexedAt: new Date().toISOString()
      }
    }));

    // Step 5: Upsert points into Qdrant Vector DB
    await qdrantClient.upsert(COLLECTION_NAME, { wait: true, points });

    return { success: true, indexedChunks: chunks.length };
  },
  { connection: redisConnection, concurrency: 2 }
);
```
