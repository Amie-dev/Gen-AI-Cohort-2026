# Chapter 08 — Express REST API & Terminal CLI Shell

## 1. Chapter Goal

The goal of this final chapter is to build the application client interfaces in [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/index.js) and [`src/cli.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/cli.js).

Users and client services interact with the RAG pipeline via two access modes:
1. **Express REST API Server (`src/index.js`)**: Serves HTTP endpoints for document uploading, asynchronous queueing, polling, and synchronous RAG queries.
2. **Terminal CLI Shell (`src/cli.js`)**: Command-line execution tool for running RAG queries directly.

---

## 2. Express REST Server (`src/index.js`)

Create [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/index.js):

```javascript
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { productionRAG } from "./rag/ragPipeline.js";
import { enqueueIndexingJob, enqueueQueryJob, queryQueue } from "./queues/indexingQueue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are supported"));
  },
});

const app = express();
app.use(express.json());

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Production Advanced RAG System" });
});

// Synchronous Direct RAG Query Endpoint
app.post("/api/rag", async (req, res) => {
  const userQuery = req.body?.query;
  if (!userQuery || typeof userQuery !== "string") {
    return res.status(400).json({ error: "Body must include a non-empty 'query' string" });
  }

  try {
    const user = req.body?.user || { id: "USER_123", tenantId: "default", accessLevel: 1 };
    const result = await productionRAG(userQuery, user);
    return res.json(result);
  } catch (err) {
    console.error("API RAG Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Asynchronous Document Upload & Indexing Endpoint
app.post("/index", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded (multipart field: 'file')" });
  }

  try {
    const job = await enqueueIndexingJob(req.file.path, req.file.originalname);
    return res.status(202).json({
      message: "File uploaded and enqueued for asynchronous indexing",
      jobId: job.id,
      file: { originalName: req.file.originalname, size: req.file.size },
    });
  } catch (err) {
    console.error("Failed to enqueue indexing job:", err);
    return res.status(500).json({ error: "Failed to queue indexing job" });
  }
});

// Asynchronous RAG Query Queueing Endpoint
app.post("/query", async (req, res) => {
  const userQuery = req.body?.query;
  if (!userQuery || typeof userQuery !== "string") {
    return res.status(400).json({ error: "Body must include a non-empty 'query' string" });
  }

  try {
    const user = req.body?.user || { id: "USER_123", tenantId: "default", accessLevel: 1 };
    const job = await enqueueQueryJob(userQuery, user);
    return res.status(202).json({
      message: "RAG Query queued for background execution",
      jobId: job.id,
      poll: `/query/${job.id}`,
    });
  } catch (err) {
    console.error("Failed to enqueue query job:", err);
    return res.status(500).json({ error: "Failed to queue query job" });
  }
});

// Polling Endpoint for Async Query Result
app.get("/query/:id", async (req, res) => {
  try {
    const job = await queryQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState();
    if (state === "completed") {
      return res.json({ jobId: job.id, status: state, result: job.returnvalue });
    }
    if (state === "failed") {
      return res.status(200).json({ jobId: job.id, status: state, error: job.failedReason });
    }

    return res.json({ jobId: job.id, status: state });
  } catch (err) {
    console.error("Failed to fetch query job:", err);
    return res.status(500).json({ error: "Failed to fetch query status" });
  }
});

app.listen(config.port, () => {
  console.log(`\n🚀 Advanced RAG HTTP API Server running on http://localhost:${config.port}`);
});
```

---

## 3. Terminal CLI Tool (`src/cli.js`)

Create [`src/cli.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/cli.js):

```javascript
import { productionRAG } from "./rag/ragPipeline.js";

async function main() {
  const args = process.argv.slice(2);
  const query = args[0] || "What is my current account balance and refund policy?";

  console.log(`⚡ Production Advanced RAG Console CLI ⚡\n`);
  console.log(`User Query: "${query}"\n`);

  const user = { id: "USER_123", tenantId: "default", accessLevel: 1 };
  const result = await productionRAG(query, user);

  console.log(`\n==================================================`);
  console.log(`🎯 FINAL ANSWER RESULT:`);
  console.log(`==================================================\n`);
  console.log(result.answer);
  console.log(`\n--------------------------------------------------`);
  console.log(`Quality Score: ${result.score}/10 | Success: ${result.success}`);
  console.log(`Sources Used:`, result.sources);
  console.log(`--------------------------------------------------\n`);
}

main();
```

---

## 4. End-to-End System Verification Walkthrough

### 1. Test Terminal CLI Interface

```bash
node src/cli.js "What is my subscription plan?"
```

---

### 2. Test REST API Chat Endpoint

```bash
curl -X POST http://localhost:8000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the status of my subscription?"}'
```

---

## 5. Guide Conclusion

Congratulations! You have completed the **Production-Grade Advanced RAG System Implementation Guide**.

You built a complete 13-step enterprise RAG architecture featuring:
1. Multi-database infrastructure with Qdrant, PostgreSQL, MongoDB, and Redis.
2. Security guardrails, prompt injection detection, and regex PII masking.
3. Multi-query translation (Rewriting, Step-Back, Sub-Queries, HyDE).
4. Smart intent-based data source routing.
5. Reciprocal Rank Fusion (RRF) and LLM relevance re-ranking.
6. Corrective RAG (CRAG) self-evaluation with automated retry feedback loops.
7. Asynchronous BullMQ PDF ingestion queue & worker process.
8. Express REST API and interactive CLI interfaces.
