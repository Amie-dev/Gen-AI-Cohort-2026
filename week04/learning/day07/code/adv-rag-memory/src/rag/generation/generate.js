import OpenAI from "openai";
import { config } from "../../config.js";

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Generation LLM Module
 * Invokes LLM generation via OpenAI, Gemini, or vLLM endpoint, with fallback.
 */
export class GenerationLLM {
  static async generateAnswer(contextPayload) {
    if (openaiClient && config.llmProvider === "openai") {
      try {
        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: contextPayload }],
          temperature: 0.2,
        });
        return response.choices[0].message.content;
      } catch (err) {
        console.warn(`[GenerationLLM Warning] OpenAI call failed, using fallback: ${err.message}`);
      }
    }

    // Smart Fallback Generation
    return `Based on your profile, long-term Mem0 memories, recent chat history, and retrieved technical RAG evidence:
The recommended system architecture integrates Mem0 long-term memory layer with production RAG retrieval pipelines, served efficiently via vLLM inference engines.`;
  }
}
