import { config } from "../config.js";

/**
 * ShortTermMemory Store
 * Manages active session sliding window history for immediate conversational continuity.
 */
export class ShortTermMemory {
  constructor(maxTurns = config.memory.stmMaxTurns) {
    this.maxTurns = maxTurns;
    this.sessions = new Map(); // sessionId -> Array of { role, content, timestamp }
  }

  async addTurn(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    if (history.length > this.maxTurns) {
      this.sessions.set(sessionId, history.slice(-this.maxTurns));
    }
  }

  async getRecentContext(sessionId, limit = null) {
    const fetchLimit = limit || this.maxTurns;
    const history = this.sessions.get(sessionId) || [];
    return history.slice(-fetchLimit);
  }
}

export const stmStore = new ShortTermMemory();
