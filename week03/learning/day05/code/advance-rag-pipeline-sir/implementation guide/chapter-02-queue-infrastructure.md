# Chapter 02 — Asynchronous Queue System (BullMQ & Redis)

## 1. Chapter Goal

The goal of this chapter is to set up an **asynchronous job queue architecture** using **BullMQ** and **Redis**.

In standard synchronous RAG implementations, when a user uploads a large PDF or asks a complex question, the HTTP request blocks until document parsing, embedding, vector upserting, or LLM generation finishes. If processing takes 30 seconds, the client connection times out or freezes.

By introducing BullMQ queues:
1. **`POST /index`**: Accepts the PDF upload, enqueues an `index-file` job into Redis, and instantly returns `HTTP 202 Accepted` with a `jobId`.
2. **`POST /query`**: Enqueues a `run-query` job into Redis, returning a `jobId` and polling URL (`/query/:id`).
3. **Workers**: Run asynchronously in separate processes, picking up jobs from Redis and completing them without holding open HTTP socket connections.

### 🎯 Expected Outcome

By the end of this chapter, you will build [`src/queue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/queue.js) containing Redis connection settings, queue instances, and helper functions:

```text
src/
└── queue.js      # Redis connection, indexingQueue, queryQueue, enqueue helpers
```

The queue interaction pattern works as follows:

```text
HTTP REST API Client
        │
        ├─► POST /index (PDF File)
        │      │
        │      └─► enqueueIndexingJob() ──► [ Redis: file-indexing queue ]
        │                                           │
        │                                           ▼
        │                                    Indexing Worker
        │
        └─► POST /query (Prompt)
               │
               └─► enqueueQueryJob()    ──► [ Redis: query queue ]
                                                    │
                                                    ▼
                                              Query Worker
```

---

## 2. Queue Configuration & Helper Implementation (`src/queue.js`)

Create [`src/queue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/queue.js):

```javascript
import { Queue } from "bullmq";
import { config, INDEXING_QUEUE, QUERY_QUEUE } from "./config.js";

// BullMQ needs `maxRetriesPerRequest: null` on the connection it uses.
export const connection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

export const indexingQueue = new Queue(INDEXING_QUEUE, { connection });
export const queryQueue = new Queue(QUERY_QUEUE, { connection });

/**
 * Enqueue a job telling the worker to index an uploaded PDF.
 * @param {{ filePath: string, originalName: string, mimeType: string, size: number }} payload
 */
export async function enqueueIndexingJob(payload) {
  return indexingQueue.add("index-file", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}

/**
 * Enqueue a query job. Completed/failed jobs are kept for a while so the
 * client can poll GET /query/:id for the result.
 * @param {{ query: string }} payload
 */
export async function enqueueQueryJob(payload) {
  return queryQueue.add("run-query", payload, {
    attempts: 2,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600, count: 1000 }, // keep 1h for polling
    removeOnFail: { age: 3600, count: 1000 },
  });
}
```

---

## 3. Detailed Code Breakdown & Technical Concepts

### 1. The `maxRetriesPerRequest: null` Setting

```javascript
export const connection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};
```

#### Why is this mandatory for BullMQ?
BullMQ relies heavily on Redis blocking commands (like `BRPOPLPUSH` or `BLMOVE`) to wait for new jobs without polling Redis continuously. Standard `ioredis` instances default to failing commands after a fixed retry limit if Redis is temporarily unresponsive. Setting `maxRetriesPerRequest: null` instructs `ioredis` to keep waiting indefinitely, allowing BullMQ to block cleanly until a new job arrives.

---

### 2. Job Retry & Exponential Backoff Strategies

```javascript
attempts: 3,
backoff: { type: "exponential", delay: 2000 }
```

When indexing a PDF or connecting to OpenAI, transient network errors (e.g. rate limits, HTTP 503 Service Unavailable) can occur:
- **Attempt 1**: Executes immediately.
- **Attempt 2 (on failure)**: Retries after $2000\text{ ms} = 2\text{ seconds}$.
- **Attempt 3 (on failure)**: Retries after $2000 \times 2^1 = 4000\text{ ms} = 4\text{ seconds}$.

This exponential backoff prevents swamping OpenAI or Qdrant during transient API hiccups.

---

### 3. Job Retention Policies for Polling (`removeOnComplete` / `removeOnFail`)

```javascript
// Indexing Queue
removeOnComplete: 100,
removeOnFail: 500

// Query Queue
removeOnComplete: { age: 3600, count: 1000 },
removeOnFail: { age: 3600, count: 1000 }
```

In an asynchronous polling model (`POST /query` returns `jobId` $\rightarrow$ `GET /query/:id`), the client needs to read the job's return value *after* the background worker completes processing.
- If jobs were immediately deleted upon completion, `GET /query/:id` would return `404 Not Found`.
- Setting `{ age: 3600, count: 1000 }` tells BullMQ to store the finished job result in Redis for **1 hour (3600 seconds)** or up to **1,000 jobs**, ensuring the client has plenty of time to poll for the answer.

---

## 4. Summary & Next Steps

In this chapter, we implemented:
- `src/queue.js`: Configured Redis connection options and created `indexingQueue` and `queryQueue`.
- `enqueueIndexingJob()`: Enqueues PDF files for background parsing and vector indexing with exponential retry logic.
- `enqueueQueryJob()`: Enqueues user queries and configures Redis job retention so clients can poll `/query/:id`.

In [**Chapter 03 — PDF Ingestion & Indexing Pipeline**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-03-indexing-pipeline.md), we will build the document parsing, sliding window text chunker, and Qdrant upsert engine.
