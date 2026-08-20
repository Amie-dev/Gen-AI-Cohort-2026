# `src/` Directory Explanations

## Overview
The `src/` directory is the core application root containing all backend HTTP server routing, database integrations, asynchronous processing queues, and Advanced RAG sub-systems.

---

## Folder Architecture & Responsibilities

| Sub-Module / File | Architectural Layer | Primary Responsibility |
| :--- | :--- | :--- |
| **`server.js`** | Presentation / HTTP Interface | REST API server exposing HTTP endpoints, payload parsing, file uploads, and global error handling. |
| **`db/`** | Data Access Layer | Database connection singletons for PostgreSQL, Qdrant Vector DB, and Redis. |
| **`queues/`** | Background Processing Layer | BullMQ job producers and async workers for PDF parsing, text chunking, and vector embedding indexing. |
| **`rag/`** | Core RAG Engine | 13-stage Advanced RAG pipeline implementing guardrails, query translation, multi-store routing, retrieval fusion, CRAG evaluation, and LLM generation. |

---

## Server Workflow & Pseudocode (`server.js`)

`server.js` decouples synchronous REST API queries from heavy asynchronous document ingestion.

```javascript
// Express HTTP Server Pseudocode Logic

import express from 'express';
import multer from 'multer';
import { productionRAG } from './rag/ragPipeline.js';
import { addIndexingJob } from './queues/indexingQueue.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

// 1. Synchronous RAG Query Endpoint
app.post('/api/rag/query', async (req, res) => {
  const { query, user } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  // Execute end-to-end 13-stage RAG pipeline
  const result = await productionRAG(query, user || defaultUser);
  return res.json({ success: true, result });
});

// 2. Asynchronous PDF Upload & Indexing Endpoint
app.post('/api/rag/index-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing' });

  // Queue ingestion task to Redis via BullMQ without blocking HTTP response
  const job = await addIndexingJob({
    filePath: req.file.path,
    originalName: req.file.originalname
  });

  return res.status(202).json({
    success: true,
    message: 'Indexing queued',
    jobId: job.id
  });
});
```

---

## Execution Flow Details

1. **Query Request Processing (`POST /api/rag/query`)**:
   - Accepts JSON payload containing `{ query, user }`.
   - Populates user defaults (`tenantId`, `accessLevel`, `role`) if unspecified.
   - Invokes `productionRAG(query, user)` asynchronously and returns synthesized answer with groundedness evaluation scores.

2. **Async Document Ingestion (`POST /api/rag/index-pdf`)**:
   - Receives multipart PDF file uploads handled via `multer`.
   - Enqueues job metadata into Redis (`"indexing"` queue).
   - Offloads file parsing, text extraction, chunking, and Qdrant upsertion to an isolated worker thread (`indexingWorker.js`).
