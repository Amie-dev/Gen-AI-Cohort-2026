# Chapter 05 — Background Worker Process (`src/worker.js`)

## 1. Chapter Goal

The goal of this chapter is to implement the background job worker runner in [`src/worker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/worker.js).

In a decoupled microservice or Node.js environment, the process accepting HTTP client requests (`src/index.js`) should remain lightweight and fast. The heavy work—parsing PDFs, calling OpenAI embeddings, writing points to Qdrant, running HyDE, and performing Reciprocal Rank Fusion—is offloaded to background **Worker Processes**.

```text
                  +-------------------------------------------------+
                  |          Redis Queue Database (Port 6379)       |
                  +------------------------+------------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
     [ file-indexing queue ]                             [ query queue ]
                   |                                               |
                   v                                               v
+------------------------------------+           +------------------------------------+
|  indexingWorker (concurrency: 2)   |           |    queryWorker (concurrency: 4)     |
+------------------------------------+           +------------------------------------+
| • Calls indexPdf(data)             |           | • Calls answerQuery(data.query)    |
| • PDF -> Chunks -> Embeddings ->   |           | • Multi-query -> RRF -> Grounded   |
|   Qdrant points upsert             |           |   Chat answer                      |
+------------------------------------+           +------------------------------------+
```

---

## 2. Complete Worker Implementation (`src/worker.js`)

Create [`src/worker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/worker.js):

```javascript
import { Worker } from "bullmq";
import { connection } from "./queue.js";
import { INDEXING_QUEUE, QUERY_QUEUE } from "./config.js";
import { indexPdf } from "./indexer.js";
import { answerQuery } from "./retriever.js";

// Worker that consumes indexing jobs enqueued by the /index route and runs the
// pipeline: parse PDF -> chunk -> embed (OpenAI) -> upsert into Qdrant.
const indexingWorker = new Worker(
  INDEXING_QUEUE,
  async (job) => {
    console.log(`📥 Indexing job ${job.id}: ${job.data.originalName}`);

    const result = await indexPdf({
      filePath: job.data.filePath,
      originalName: job.data.originalName,
    });

    console.log(`   → ${result.chunks} chunk(s) indexed`);
    return result;
  },
  { connection, concurrency: 2 }
);

// Worker that consumes query jobs enqueued by the /query route and runs the
// RAG pipeline: embed query -> search Qdrant -> generate an answer.
const queryWorker = new Worker(
  QUERY_QUEUE,
  async (job) => {
    console.log(`🔎 Query job ${job.id}: ${JSON.stringify(job.data.query)}`);
    const result = await answerQuery(job.data.query);
    console.log(`   → answered using ${result.sources.length} chunk(s)`);
    return result;
  },
  { connection, concurrency: 4 }
);

for (const [name, worker] of [
  ["indexing", indexingWorker],
  ["query", queryWorker],
]) {
  worker.on("completed", (job) => console.log(`✅ [${name}] job ${job.id} completed`));
  worker.on("failed", (job, err) => console.error(`❌ [${name}] job ${job?.id} failed:`, err.message));
}

console.log("👷 Workers started (indexing + query). Waiting for jobs...");
```

---

## 3. Deep-Dive Worker Rationale & Architecture

### 1. Independent Concurrency Settings

```javascript
// Indexing Worker
{ connection, concurrency: 2 }

// Query Worker
{ connection, concurrency: 4 }
```

#### Why separate concurrency limits?
- **Indexing (`concurrency: 2`)**: Indexing jobs involve reading large PDF buffers into memory, generating hundreds of text chunks, and sending batch embedding requests. Keeping indexing concurrency lower (2 parallel jobs) protects server RAM and prevents hitting OpenAI rate limits.
- **Queries (`concurrency: 4`)**: Query jobs spend most of their time waiting on external API HTTP responses (OpenAI JSON schema + Qdrant search). Setting query concurrency higher (4 parallel jobs) allows the worker to process multiple user questions simultaneously while I/O is pending.

---

### 2. Job Return Value Persistence

Notice the worker handler functions return values:

```javascript
// Indexing Worker Handler
return result; // { chunks: 14, collection: "documents" }

// Query Worker Handler
return result; // { query, answer, sources }
```

When a BullMQ worker handler returns an object, BullMQ serializes it and saves it into Redis under `job.returnvalue`. This enables the Express API polling route (`GET /query/:id`) to retrieve `job.returnvalue` and send the final RAG answer back to the polling client.

---

### 3. Worker Event Hooks (`completed` & `failed`)

```javascript
worker.on("completed", (job) => console.log(`✅ [${name}] job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`❌ [${name}] job ${job?.id} failed:`, err.message));
```

If an error occurs inside `indexPdf()` or `answerQuery()` (e.g. invalid OpenAI key or Qdrant connection drop):
- The error is caught by BullMQ's worker execution wrapper.
- The `failed` event triggers, logging the exact error message.
- If remaining retry attempts exist (e.g., `attempts: 3`), BullMQ moves the job back into the delayed queue for exponential retry.
- If all retries fail, `job.failedReason` is updated in Redis, allowing the polling API to notify the client.

---

## 4. Running the Worker Process

To run the worker process independently from the API server:

```bash
npm run worker
```

Output:
```text
👷 Workers started (indexing + query). Waiting for jobs...
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `src/worker.js`: Dual BullMQ workers handling PDF indexing and multi-step query retrieval.
- Concurrency controls (`concurrency: 2` for indexing, `concurrency: 4` for queries).
- Event listener handlers (`completed` and `failed`) for job monitoring.

In [**Chapter 06 — Express REST Server & Polling Endpoints**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-06-api-server-polling.md), we will build the Express REST API, Multer upload configuration, and query polling controller.
