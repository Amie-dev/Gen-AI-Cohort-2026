import { Worker } from "bullmq";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import OpenAI from "openai";
import { redisConnection } from "../db/redis.js";
import { INDEXING_QUEUE, QUERY_QUEUE, config } from "../config.js";
import { qdrant, ensureCollection } from "../db/qdrant.js";
import { productionRAG } from "../rag/ragPipeline.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Text Chunking with word-boundary awareness
 */
function chunkText(text, chunkSize = config.chunking.chunkSize, overlap = config.chunking.chunkOverlap) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);

    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

// 1. Indexing Worker Process
export const indexingWorker = new Worker(
  INDEXING_QUEUE,
  async (job) => {
    const { filePath, originalName } = job.data;
    console.log(`📥 [Worker] Processing Indexing Job ${job.id}: ${originalName}`);

    const collection = await ensureCollection();
    const buffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(buffer);
    const chunks = chunkText(pdfData.text);

    if (chunks.length === 0) {
      return { indexed: 0, message: "No extractable text found in PDF" };
    }

    // Embed in batch
    const embRes = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: chunks,
    });

    const points = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      vector: embRes.data[i].embedding,
      payload: {
        text: chunk,
        source: originalName,
        filePath,
        chunkIndex: i,
        tenantId: "default",
        accessLevel: 1,
      },
    }));

    await qdrant.upsert(collection, { wait: true, points });
    console.log(`   → ${chunks.length} chunk(s) indexed into Qdrant collection "${collection}"`);

    return { indexed: chunks.length, collection };
  },
  { connection: redisConnection, concurrency: 2 }
);

// 2. Query Worker Process
export const queryWorker = new Worker(
  QUERY_QUEUE,
  async (job) => {
    const { userQuery, user } = job.data;
    console.log(`🔎 [Worker] Processing Async Query Job ${job.id}: "${userQuery}"`);

    const result = await productionRAG(userQuery, user);
    return result;
  },
  { connection: redisConnection, concurrency: 4 }
);

for (const [name, worker] of [
  ["indexing", indexingWorker],
  ["query", queryWorker],
]) {
  worker.on("completed", (job) => console.log(`✅ [${name}] Job ${job.id} completed successfully`));
  worker.on("failed", (job, err) => console.error(`❌ [${name}] Job ${job?.id} failed:`, err.message));
}

console.log("👷 Production RAG Background Workers started (indexing + query). Waiting for queue jobs...");
