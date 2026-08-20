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
