# Chapter 06 — Express REST Server & Polling Endpoints (`src/index.js`)

## 1. Chapter Goal

The goal of this chapter is to build the primary Express REST API server in [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/index.js).

The REST server acts as the entry point for clients, exposing endpoints for:
1. **Health Verification**: `GET /health`
2. **Asynchronous PDF Upload**: `POST /index`
3. **Asynchronous RAG Query Submission**: `POST /query`
4. **Job Result Polling**: `GET /query/:id`

### 🎯 Expected Outcome

```text
HTTP Client (Postman / Curl / Web)
        │
        ├─► GET /health          ──► 200 OK { status: "ok" }
        │
        ├─► POST /index (PDF)    ──► 202 Accepted { jobId: "1", file: {...} }
        │
        ├─► POST /query (Prompt) ──► 202 Accepted { jobId: "2", poll: "/query/2" }
        │
        └─► GET /query/2         ──► 200 OK { status: "completed", result: {...} }
```

---

## 2. Complete Server Implementation (`src/index.js`)

Create [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/index.js):

```javascript
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { enqueueIndexingJob, enqueueQueryJob, queryQueue } from "./queue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure the uploads directory exists.
fs.mkdirSync(uploadDir, { recursive: true });

// --- Multer config: store PDFs on disk with a unique name ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomUUID()}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are allowed"));
  },
});

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// --- POST /index : upload a PDF and enqueue an indexing job ---
app.post("/index", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No PDF file uploaded (field: 'file')" });
  }

  try {
    const job = await enqueueIndexingJob({
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(202).json({
      message: "File uploaded and queued for indexing",
      jobId: job.id,
      file: {
        originalName: req.file.originalname,
        storedAs: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error("Failed to enqueue indexing job:", err);
    return res.status(500).json({ error: "Failed to queue file for indexing" });
  }
});

// --- POST /query : enqueue a RAG query job, return the job id to poll ---
app.post("/query", async (req, res) => {
  const query = req.body?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Body must include a non-empty 'query' string" });
  }

  try {
    const job = await enqueueQueryJob({ query: query.trim() });
    return res.status(202).json({
      message: "Query queued",
      jobId: job.id,
      poll: `/query/${job.id}`,
    });
  } catch (err) {
    console.error("Failed to enqueue query job:", err);
    return res.status(500).json({ error: "Failed to queue query" });
  }
});

// --- GET /query/:id : poll for the status/result of a query job ---
app.get("/query/:id", async (req, res) => {
  try {
    const job = await queryQueue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();

    if (state === "completed") {
      return res.json({
        jobId: job.id,
        status: state,
        result: job.returnvalue,
      });
    }
    if (state === "failed") {
      return res
        .status(200)
        .json({ jobId: job.id, status: state, error: job.failedReason });
    }

    // waiting | active | delayed | paused
    return res.json({ jobId: job.id, status: state });
  } catch (err) {
    console.error("Failed to fetch query job:", err);
    return res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Multer / route error handler.
app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(400).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`🚀 Server listening on http://localhost:${config.port}`);
});
```

---

## 3. Deep-Dive Code Breakdown & API Workflow

### 1. ESM `__dirname` Polyfill & Disk Storage

In Node.js ES Modules, `__dirname` and `__filename` are not available globally. We recreate `__dirname` using standard Node.js utility methods:

```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
```

Multer uses `multer.diskStorage` to ensure every uploaded PDF gets a collision-free filename combining timestamp and UUID:
```javascript
filename: (_req, file, cb) => {
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  cb(null, `${unique}${path.extname(file.originalname)}`);
}
```

---

### 2. Multer Security & Validation Controls

```javascript
limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB Limit
fileFilter: (_req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  cb(new Error("Only PDF files are allowed"));
}
```

- **MIME Type Validation**: Restricts uploads strictly to `application/pdf`. Non-PDF files (e.g. `.exe`, `.png`) trigger a `400 Bad Request`.
- **File Size Safeguard**: Rejects files exceeding 25 MB to prevent server disk exhaustion.

---

### 3. Asynchronous Polling Mechanics (`GET /query/:id`)

When a client queries `GET /query/:id`, we fetch the job from `queryQueue.getJob(id)` and inspect its current state:

```javascript
const state = await job.getState();
```

The job can exist in 5 states:

| Job State | HTTP Status | Response Payload Example | Description |
| :--- | :--- | :--- | :--- |
| **`waiting`** | `200 OK` | `{ jobId: "1", status: "waiting" }` | Enqueued in Redis; waiting for an available worker thread. |
| **`active`** | `200 OK` | `{ jobId: "1", status: "active" }` | Currently being processed by a worker (generating embeddings or running RRF). |
| **`completed`** | `200 OK` | `{ jobId: "1", status: "completed", result: { answer, sources } }` | Finished successfully! `job.returnvalue` contains the grounded LLM answer and retrieved source chunks. |
| **`failed`** | `200 OK` | `{ jobId: "1", status: "failed", error: "OpenAI Rate Limit Exceeded" }` | All retry attempts failed; returns error reason. |
| **`not found`** | `404 Not Found` | `{ error: "Job not found" }` | Invalid or expired job ID. |

---

## 4. End-to-End Manual Testing Walkthrough

### Step 1: Health Check

```bash
curl http://localhost:8000/health
```

**Response**:
```json
{ "status": "ok" }
```

---

### Step 2: Upload a PDF Document

```bash
curl -X POST http://localhost:8000/index \
  -F "file=@/path/to/sample.pdf"
```

**Response (`HTTP 202 Accepted`)**:
```json
{
  "message": "File uploaded and queued for indexing",
  "jobId": "1",
  "file": {
    "originalName": "sample.pdf",
    "storedAs": "1741200000000-a1b2c3d4.pdf",
    "size": 145020
  }
}
```

Check the worker terminal output:
```text
📥 Indexing job 1: sample.pdf
   → 12 chunk(s) indexed
✅ [indexing] job 1 completed
```

---

### Step 3: Submit a Query

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the primary conclusion of the document?"}'
```

**Response (`HTTP 202 Accepted`)**:
```json
{
  "message": "Query queued",
  "jobId": "1",
  "poll": "/query/1"
}
```

---

### Step 4: Poll for the RAG Result

```bash
curl http://localhost:8000/query/1
```

**Response (`HTTP 200 OK` when completed)**:
```json
{
  "jobId": "1",
  "status": "completed",
  "result": {
    "query": "What is the primary conclusion of the document?",
    "answer": "According to Section 4, the primary conclusion is...",
    "sources": [
      {
        "text": "Section 4 conclusion passage...",
        "source": "sample.pdf",
        "chunkIndex": 3,
        "score": 0.8845
      }
    ]
  }
}
```

---

## 5. Summary & Conclusion

Congratulations! You have completed the **Advanced RAG Pipeline Implementation Guide**.

Throughout this guide, you built a production-oriented, scalable RAG architecture featuring:
1. Dockerized infrastructure with **Qdrant Vector DB** and **Redis**.
2. Robust Node.js ESM project setup with centralized environment parameters.
3. Batched vector embedding generation and Qdrant collection auto-provisioning.
4. Asynchronous job queues using **BullMQ** with exponential retry backoff.
5. Boundary-aware sliding-window PDF text chunker.
6. Multi-query retrieval engine powered by **Query Rewriting**, **Step-Back Prompting**, **Sub-Query Decomposition**, **HyDE**, and **Reciprocal Rank Fusion (RRF)**.
7. Concurrent background worker processes.
8. Express REST API with file security and asynchronous request polling.
