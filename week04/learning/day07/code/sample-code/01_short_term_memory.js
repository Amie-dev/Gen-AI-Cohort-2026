/**
 * 01_short_term_memory.js
 * 
 * Short-Term Memory (STM) Implementation for AI Agents
 * Demonstrates sliding-window context history persisted in an in-memory SQL/Store buffer.
 */

import { fileURLToPath } from "url";

export class ShortTermMemoryStore {
  constructor(maxMessages = 20) {
    this.maxMessages = maxMessages;
    this.sessions = new Map(); // sessionId -> Array of { role, content, timestamp }
  }

  /**
   * Save a message to short-term memory
   */
  async addMessage(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Fetch latest sliding window of messages for LLM context construction
   */
  async getRecentContext(sessionId, limit = null) {
    const fetchLimit = limit || this.maxMessages;
    const history = this.sessions.get(sessionId) || [];
    
    // Select latest N messages ordered by timestamp
    return history.slice(-fetchLimit);
  }

  /**
   * Clear session STM
   */
  async clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

// Example execution
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    const stm = new ShortTermMemoryStore(5); // sliding window of 5 messages
    const sessionId = "user_session_101";

    console.log("=== 1. Adding conversation turns ===");
    await stm.addMessage(sessionId, "user", "Hi, my name is Alex and I live in Tokyo.");
    await stm.addMessage(sessionId, "assistant", "Hello Alex! How can I help you today in Tokyo?");
    await stm.addMessage(sessionId, "user", "I prefer vegetarian food.");
    await stm.addMessage(sessionId, "assistant", "Noted! I will keep vegetarian options in mind.");
    await stm.addMessage(sessionId, "user", "Can you recommend a good place to visit?");
    await stm.addMessage(sessionId, "assistant", "Senso-ji Temple in Asakusa is wonderful.");
    await stm.addMessage(sessionId, "user", "Is there good food near there?");

    const window = await stm.getRecentContext(sessionId);
    console.log(`\n=== 2. Recent Sliding Window (Limit: 5) ===`);
    console.dir(window, { depth: null });
  })();
}
