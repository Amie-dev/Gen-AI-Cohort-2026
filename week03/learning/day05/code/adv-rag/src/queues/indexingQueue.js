import { Queue } from "bullmq";
import { redisConnection } from "../db/redis.js";
import { INDEXING_QUEUE, QUERY_QUEUE } from "../config.js";

export const indexingQueue = new Queue(INDEXING_QUEUE, { connection: redisConnection });
export const queryQueue = new Queue(QUERY_QUEUE, { connection: redisConnection });

export async function enqueueIndexingJob(filePath, originalName) {
  return indexingQueue.add(
    "index-document",
    { filePath, originalName },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}

export async function enqueueQueryJob(userQuery, user) {
  return queryQueue.add(
    "run-rag-query",
    { userQuery, user },
    {
      attempts: 2,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 3600, count: 1000 },
    }
  );
}
