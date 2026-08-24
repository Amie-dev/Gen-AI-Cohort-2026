import { MemoryQueue } from "../queues/memoryQueue.js";
import { MemoryWriter } from "./memoryWriter.js";

/**
 * Background Memory Worker
 * Processes queued conversation logs offline, extracting long-term facts into Mem0 without blocking API requests.
 */
export async function runMemoryWorkerPass() {
  console.log("🌙 [Background Memory Worker] Checking memory_jobs_queue...");
  
  let processedCount = 0;
  let job;

  while ((job = await MemoryQueue.dequeueJob())) {
    processedCount++;
    const { userId, userQuery, assistantResponse } = job.data;

    console.log(` └─ Processing Job ${job.id} for UserId: ${userId}`);
    const saved = await MemoryWriter.evaluateAndUpdateMemory(userId, userQuery, assistantResponse);
    console.log(`    └─ Extracted & Persisted ${saved.length} memory item(s).`);
  }

  return { processedCount, status: "Worker pass finished" };
}
