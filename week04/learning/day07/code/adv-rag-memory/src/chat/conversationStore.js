/**
 * ConversationStore
 * Stores raw, immutable conversation logs for analytics, debugging, and offline worker memory processing.
 */
export class ConversationStore {
  constructor() {
    this.logs = []; // Array of { id, userId, sessionId, userQuery, assistantResponse, timestamp }
  }

  async logInteraction(userId, sessionId, userQuery, assistantResponse) {
    const record = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      sessionId,
      userQuery,
      assistantResponse,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(record);
    return record;
  }

  async getLogsForUser(userId) {
    return this.logs.filter((l) => l.userId === userId);
  }
}

export const conversationStore = new ConversationStore();
