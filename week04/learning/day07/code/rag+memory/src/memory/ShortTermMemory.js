/**
 * ShortTermMemory.js
 * Sliding Window Short-Term Memory (STM) Store
 * Persists recent N turns per session to maintain immediate conversation continuity.
 */
export class ShortTermMemory {
  constructor(maxTurns = 6) {
    this.maxTurns = maxTurns;
    this.sessions = new Map(); // sessionId -> Array of { role, content, timestamp }
  }

  /**
   * Append a message turn to short-term memory
   */
  async addMessage(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Enforce sliding window size limit
    if (history.length > this.maxTurns) {
      this.sessions.set(sessionId, history.slice(-this.maxTurns));
    }
  }

  /**
   * Fetch recent sliding window messages
   */
  async getRecentWindow(sessionId, limit = null) {
    const fetchLimit = limit || this.maxTurns;
    const history = this.sessions.get(sessionId) || [];
    return history.slice(-fetchLimit);
  }

  /**
   * Clear session history
   */
  async clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}
