import { redisCache } from "../infrastructure/redis.js";

/**
 * MemoryQueue Manager
 * Queues conversation interaction payloads asynchronously for background worker processing.
 */
export class MemoryQueue {
  static async enqueueJob(jobData) {
    const payload = JSON.stringify({
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      data: jobData,
    });

    await redisCache.lpush("memory_jobs_queue", payload);
    return true;
  }

  static async dequeueJob() {
    const raw = await redisCache.rpop("memory_jobs_queue");
    return raw ? JSON.parse(raw) : null;
  }
}
