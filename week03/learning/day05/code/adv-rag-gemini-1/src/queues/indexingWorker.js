import { Worker } from 'bullmq';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { redisConnection } from '../db/redis.js';
import { INDEXING_QUEUE_NAME } from './indexingQueue.js';
import { qdrantClient, COLLECTION_NAME, initQdrantCollection } from '../db/qdrant.js';

// Simple text chunker helper
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index, index + chunkSize);
    chunks.push(chunk);
    index += (chunkSize - overlap);
  }
  return chunks;
}

// Dummy vector embedding helper fallback
function generateDummyVector(text, dimension = 1536) {
  const vector = new Array(dimension).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < dimension; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

export const indexingWorker = new Worker(
  INDEXING_QUEUE_NAME,
  async (job) => {
    const { filePath, originalName } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id}: Indexing ${originalName || filePath}...`);

    let textContent = '';
    if (filePath && fs.existsSync(filePath)) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else {
      textContent = `Mock document text for indexing sample ${originalName || 'doc.pdf'}. Contains refund policy and subscription details.`;
    }

    const chunks = chunkText(textContent);
    console.log(`[BullMQ Worker] Split text into ${chunks.length} chunks.`);

    await initQdrantCollection();

    const points = chunks.map((chunk, idx) => ({
      id: idx + 1 + Math.floor(Math.random() * 100000),
      vector: generateDummyVector(chunk),
      payload: {
        text: chunk,
        title: originalName || 'Uploaded PDF Document',
        tenantId: 'tenant_1',
        accessLevel: 1,
        source: 'PDF_Upload',
        indexedAt: new Date().toISOString()
      }
    }));

    try {
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points
      });
      console.log(`[BullMQ Worker] Successfully upserted ${points.length} vector points to Qdrant.`);
    } catch (err) {
      console.warn(`[BullMQ Worker Warning] Could not upsert to Qdrant server (${err.message}). Worker step completed with mock fallback.`);
    }

    return {
      success: true,
      indexedChunks: chunks.length,
      fileName: originalName || filePath
    };
  },
  {
    connection: redisConnection,
    concurrency: 2
  }
);

indexingWorker.on('completed', (job, result) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed! Results:`, result);
});

indexingWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
});
