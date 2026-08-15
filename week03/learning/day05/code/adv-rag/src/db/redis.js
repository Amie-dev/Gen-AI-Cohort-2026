import { config } from "../config.js";

// Connection parameters required by BullMQ
export const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};
