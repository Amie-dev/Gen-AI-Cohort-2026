import { Queue } from 'bullmq';
import { redisConnection } from '../db/redis.js';

export const INDEXING_QUEUE_NAME = 'indexing';

export const indexingQueue = new Queue(INDEXING_QUEUE_NAME, {
  connection: redisConnection
});

/**
 * Add document indexing job to BullMQ queue
 */
export async function addIndexingJob(jobData) {
  console.log(`[BullMQ Producer] Adding indexing job for file: ${jobData.originalName || jobData.filePath}`);

  const job = await indexingQueue.add('index-document', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true
  });

  return job;
}
