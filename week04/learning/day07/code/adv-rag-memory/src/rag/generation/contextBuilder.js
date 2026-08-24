/**
 * Context Assembly Engine (Step 6 / Section 10 of Implementation Guide)
 * Combines 4 major sources:
 *  1. System Prompt Instructions
 *  2. Relevant Mem0 Long-Term User Memories
 *  3. Recent Conversation History (STM Sliding Window)
 *  4. Top-K RAG Knowledge Evidence
 *  5. Current User Query
 */
export class ContextBuilder {
  static buildContextPayload(systemPrompt, userMemories, stmHistory, ragEvidence, currentQuery) {
    let payload = `=== SYSTEM INSTRUCTIONS ===\n${systemPrompt || "You are a personalized AI Assistant."}\n\n`;

    payload += `=== RELEVANT MEM0 USER MEMORIES (LONG-TERM) ===\n`;
    if (userMemories && userMemories.length > 0) {
      userMemories.forEach((mem, idx) => {
        payload += `[Mem ${idx + 1}] Category: ${mem.category} | ${mem.memory}\n`;
      });
    } else {
      payload += `(No relevant long-term user memories found)\n`;
    }

    payload += `\n=== RECENT CONVERSATION HISTORY (STM SLIDING WINDOW) ===\n`;
    if (stmHistory && stmHistory.length > 0) {
      stmHistory.forEach((turn) => {
        payload += `${turn.role.toUpperCase()}: ${turn.content}\n`;
      });
    } else {
      payload += `(No previous conversation turns)\n`;
    }

    payload += `\n=== RETRIEVED RAG EVIDENCE (KNOWLEDGE BASE) ===\n`;
    if (ragEvidence && ragEvidence.length > 0) {
      ragEvidence.forEach((doc, idx) => {
        payload += `[Evidence ${idx + 1}] Source: ${doc.source} | Title: ${doc.title}\nContent: ${doc.content}\n\n`;
      });
    } else {
      payload += `(No external knowledge evidence retrieved)\n`;
    }

    payload += `=== CURRENT USER QUERY ===\n${currentQuery}`;

    return payload;
  }
}
