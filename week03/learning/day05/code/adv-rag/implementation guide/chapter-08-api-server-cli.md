# Chapter 08 — Express REST API & Terminal CLI Shell

## 1. Chapter Goal

The goal of this final chapter is to build the application client interfaces in [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/index.js) and [`src/cli.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/cli.js).

Users and client services interact with the RAG pipeline via two access modes:
1. **Express REST API Server (`src/index.js`)**: Serves HTTP endpoints for document uploading and RAG chat.
2. **Interactive CLI Shell (`src/cli.js`)**: Terminal Readline environment for debugging RAG query pipeline execution directly in the console.

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
import { enqueueIndexingJob } from "./queues/indexingQueue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomUUID()}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are allowed"));
  },
});

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// --- POST /api/rag/chat : Execute Master 13-Step Production RAG Pipeline ---
app.post("/api/rag/chat", async (req, res) => {
  const { query, user } = req.body || {};

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Body must include a non-empty 'query' string." });
  }

  try {
    const result = await productionRAG(query.trim(), user);
    return res.json(result);
  } catch (err) {
    console.error("Failed to process RAG request:", err);
    return res.status(500).json({ error: "Internal RAG processing error." });
  }
});

// --- POST /api/rag/index : Upload PDF & Enqueue Async Indexing Job ---
app.post("/api/rag/index", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded (field name: 'file')." });
  }

  try {
    const job = await enqueueIndexingJob({
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(202).json({
      message: "PDF uploaded and queued for background indexing.",
      jobId: job.id,
      file: { originalName: req.file.originalname, size: req.file.size },
    });
  } catch (err) {
    console.error("Failed to queue indexing job:", err);
    return res.status(500).json({ error: "Failed to queue file for indexing." });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(400).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`🚀 Advanced RAG REST API server running on http://localhost:${config.port}`);
});
```

---

## 3. Interactive Terminal CLI Shell (`src/cli.js`)

Create [`src/cli.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/cli.js):

```javascript
import readline from "node:readline";
import { productionRAG } from "./rag/ragPipeline.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("==================================================");
console.log("🤖 Enterprise Advanced RAG Interactive CLI Shell");
console.log("Type your question below (or type 'exit' to quit):");
console.log("==================================================\n");

function promptUser() {
  rl.question("❓ Question: ", async (input) => {
    const query = input.trim();
    if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
      console.log("👋 Exiting CLI. Goodbye!");
      rl.close();
      process.exit(0);
    }

    if (query.length > 0) {
      const result = await productionRAG(query);
      console.log("\n==================================================");
      console.log(`💬 Answer: ${result.answer}`);
      console.log(`📊 CRAG Score: ${result.score}/10 | Attempts: ${result.attempts}`);
      if (result.sources && result.sources.length > 0) {
        console.log(`📚 Sources: ${result.sources.map((s) => s.title).join(", ")}`);
      }
      console.log("==================================================\n");
    }

    promptUser();
  });
}

promptUser();
```

---

## 4. End-to-End System Verification Walkthrough

### 1. Test Terminal CLI Interface

```bash
npm run cli
```

**Console Session**:
```text
🤖 Enterprise Advanced RAG Interactive CLI Shell
Type your question below (or type 'exit' to quit):

❓ Question: What is my billing status and subscription plan?

🚀 Starting Production RAG Pipeline for query: "What is my billing status and subscription plan?"
🛡️ [Input Guardrails] Validating input query...
🧩 [Step 2] Translating query into multiple representations...
🔀 [Step 3 & 4] Routing queries & executing multi-source retrieval...
🛢️ [Router] Classified query intent -> "sql" (Relational DB)
📊 [Step 6] Merging ranked lists using Reciprocal Rank Fusion (RRF)...
⭐ [Step 7] Re-ranking candidates...
🤖 [Step 10] Generating grounded answer...
📋 [Step 11] Running CRAG evaluation... (Score 9/10)

💬 Answer: User John Doe is on the Pro Tier subscription. Your account status is Active with a monthly fee of $29.99.
📊 CRAG Score: 9/10 | Attempts: 1
```

---

### 2. Test REST API Chat Endpoint

```bash
curl -X POST http://localhost:8000/api/rag/chat \
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
