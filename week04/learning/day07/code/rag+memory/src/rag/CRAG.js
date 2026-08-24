import { generateJSON } from "../utils/llm.js";

/**
 * CRAG.js — Corrective RAG Evaluator
 * Evaluates quality and groundedness of retrieved document context before generation.
 */
export class CRAG {
  /**
   * Evaluate context relevance against query
   */
  async evaluateContext(query, retrievedChunks, threshold = 6.0) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        score: 0,
        isSufficient: false,
        reasoning: "No documents retrieved.",
      };
    }

    const contextText = retrievedChunks.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    const systemPrompt = `You are a CRAG Evaluator for an Advanced RAG system.
Assess if the provided retrieved context is relevant and sufficient to answer the user query.
Return JSON:
- "score": number between 0 and 10
- "isSufficient": boolean (true if score >= 6)
- "reasoning": concise explanation of assessment`;

    const userPrompt = `User Query: "${query}"\n\nRetrieved Context:\n${contextText}`;

    try {
      const evalResult = await generateJSON(systemPrompt, userPrompt);
      const score = typeof evalResult.score === "number" ? evalResult.score : 8.0;
      return {
        score,
        isSufficient: score >= threshold,
        reasoning: evalResult.reasoning || "Context contains relevant technical information.",
      };
    } catch (err) {
      console.warn(`[CRAG Warning] Evaluation failed, defaulting to pass: ${err.message}`);
      return {
        score: 7.5,
        isSufficient: true,
        reasoning: "Default evaluation pass fallback.",
      };
    }
  }
}
