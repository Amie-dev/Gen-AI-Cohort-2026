import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 5: HyDE (Hypothetical Document Embeddings)
 * Generates a hypothetical reference document passage that would answer the query.
 */
export async function createHyDE(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Write a concise, factual passage (3-5 sentences) that directly answers the user's question, " +
            "as if it were an excerpt from an authoritative reference document. Do not add conversational filler.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ HyDE generation failed, fallback to query:", err.message);
    return query;
  }
}
