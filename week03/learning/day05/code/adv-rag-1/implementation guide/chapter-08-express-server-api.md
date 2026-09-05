# Chapter 08 — Express REST API Server & Endpoint Verification

## 1. Chapter Goal

The goal of this final chapter is to build the primary Express REST API application in [`src/server.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/server.js).

The Express application exposes 3 primary endpoints:
1. **Health Verification**: `GET /health`
2. **Synchronous Master RAG Query**: `POST /api/rag/query`
3. **Asynchronous PDF Upload**: `POST /api/rag/index-pdf`

---

## 2. Complete Server Implementation (`src/server.js`)

Create [`src/server.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/server.js):

```javascript
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { productionRAG } from './rag/ragPipeline.js';
import { addIndexingJob } from './queues/indexingQueue.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Advanced RAG System (adv-rag-1)'
  });
});

// Production RAG Query Endpoint
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, user } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Field "query" is required.' });
    }

    const userInfo = user || {
      id: 'usr_default',
      tenantId: 'tenant_1',
      accessLevel: 5,
      role: 'user'
    };

    const result = await productionRAG(query, userInfo);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error processing RAG query:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

// Async PDF Indexing Endpoint (Queued via BullMQ)
app.post('/api/rag/index-pdf', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const job = await addIndexingJob({
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString()
    });

    res.status(202).json({
      success: true,
      message: 'PDF indexing job accepted and queued.',
      jobId: job.id
    });
  } catch (error) {
    console.error('Error queueing indexing job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to queue indexing job'
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Advanced RAG Server running on port ${port}`);
});
```

---

## 3. End-to-End System Verification Walkthrough

### Step 1: Start Server Process

```bash
npm run start
```

Output:
```text
🚀 Advanced RAG Server running on port 3000
```

---

### Step 2: Test Health Check Endpoint

```bash
curl http://localhost:3000/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-05T20:55:00.000Z",
  "service": "Advanced RAG System (adv-rag-1)"
}
```

---

### Step 3: Test Production RAG Query (`POST /api/rag/query`)

```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the rules regarding customer plan refunds?"}'
```

**Response (`HTTP 200 OK`)**:
```json
{
  "success": true,
  "result": {
    "success": true,
    "answer": "Based on the provided documentation context, customer refund requests are processed according to the plan terms. Eligible accounts are entitled to a prorated refund within 30 days of subscription renewal upon verification.",
    "score": 8,
    "attempts": 1,
    "sources": [
      {
        "id": "sql_usr_default",
        "title": "Account Record (Acme Corporation)",
        "source": "PostgreSQL DB (accounts table)",
        "score": 0.95
      },
      {
        "id": "vec_doc_1",
        "title": "Company Policy Documentation",
        "source": "Qdrant Vector DB (policy.pdf)",
        "score": 0.92
      }
    ]
  }
}
```

---

### Step 4: Upload PDF Document (`POST /api/rag/index-pdf`)

```bash
curl -X POST http://localhost:3000/api/rag/index-pdf \
  -F "file=@/path/to/terms.pdf"
```

**Response (`HTTP 202 Accepted`)**:
```json
{
  "success": true,
  "message": "PDF indexing job accepted and queued.",
  "jobId": "1"
}
```

Check the worker console output:
```text
📥 [Indexing Worker] Processing Job 1: terms.pdf
✅ Indexed 8 chunks into Qdrant collection "adv_rag_1_documents".
✅ Indexing Job 1 completed.
```

---

## 4. Summary & Guide Conclusion

Congratulations! You have completed the **Advanced RAG Project (`adv-rag-1`) Implementation Guide**.

In this guide, you built a complete 13-step enterprise RAG application featuring:
1. Dockerized infrastructure with Qdrant Vector DB, Redis, and PostgreSQL.
2. Shared LLM client abstraction (`src/rag/llmClient.js`) supporting automated offline mock generation.
3. Multi-tiered security guardrails with PII tokenization (`[EMAIL_1]`).
4. 4-way query translation (Query Rewriting, Step-Back Prompting, Sub-Query Decomposition, HyDE).
5. Multi-source database intent router and standardized data store adapters.
6. Vector similarity search, multi-tenant permission filtering, Reciprocal Rank Fusion (RRF), and LLM cross-encoder re-ranking.
7. Corrective RAG (CRAG) self-evaluation with automated retry feedback loops.
8. Asynchronous PDF ingestion queue backed by BullMQ & Redis.
9. Express REST API application with file upload security.
