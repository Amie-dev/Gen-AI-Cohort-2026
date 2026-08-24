import { generateJSON } from "../utils/llm.js";

/**
 * QueryTranslator.js
 * Pre-retrieval query translation engine executing:
 *  1. Query Rewriting
 *  2. Step-Back Prompting
 *  3. Sub-Query Decomposition
 *  4. HyDE (Hypothetical Document Generation)
 */
export class QueryTranslator {
  /**
   * Translate a single user query into multiple optimized retrieval representations
   */
  async translateQuery(rawQuery) {
    const systemPrompt = `You are an expert Query Translator LLM for a production RAG system.
Given a user query, output a JSON object with:
- "rewritten": A clean, concise, keyword-rich search query.
- "stepBack": A higher-level conceptual/background question.
- "subQueries": An array of 2 distinct sub-questions targeting specific aspects.
- "hydeDocument": A hypothetical paragraph answering the query (HyDE).`;

    const userPrompt = `User Query: "${rawQuery}"`;

    try {
      const translated = await generateJSON(systemPrompt, userPrompt);
      return {
        original: rawQuery,
        rewritten: translated.rewritten || rawQuery,
        stepBack: translated.stepBack || rawQuery,
        subQueries: Array.isArray(translated.subQueries) ? translated.subQueries : [rawQuery],
        hydeDocument: translated.hydeDocument || rawQuery,
      };
    } catch (err) {
      console.warn(`[QueryTranslator Warning] Translation failed, using raw query fallback: ${err.message}`);
      return {
        original: rawQuery,
        rewritten: rawQuery,
        stepBack: rawQuery,
        subQueries: [rawQuery],
        hydeDocument: rawQuery,
      };
    }
  }
}
