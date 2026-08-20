import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnection = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null
};

export const createRedisClient = () => {
  return new Redis(redisConnection);
};
