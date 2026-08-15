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
