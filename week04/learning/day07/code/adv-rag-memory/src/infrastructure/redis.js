/**
 * Infrastructure Connector: Redis In-Memory Key-Value Store
 * Used for session cache and queue buffer simulation.
 */
export class RedisConnector {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return "OK";
  }

  async lpush(queueName, payload) {
    if (!this.store.has(queueName)) this.store.set(queueName, []);
    this.store.get(queueName).unshift(payload);
  }

  async rpop(queueName) {
    if (!this.store.has(queueName)) return null;
    const list = this.store.get(queueName);
    return list.pop() || null;
  }
}

export const redisCache = new RedisConnector();
