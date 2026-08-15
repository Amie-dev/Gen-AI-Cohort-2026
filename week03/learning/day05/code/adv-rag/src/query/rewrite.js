import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 2: Query Rewriting
 * Corrects typos, grammar, and expands implicit context for search retrieval.
 */
export async function rewriteQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a query rewriting assistant for a vector retrieval system. " +
            "Rewrite the user query to make it explicit, clear, self-contained, and free of typos/grammar issues. " +
            "Preserve original intent. Do NOT answer the question. Respond ONLY with the rewritten string.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ Query Rewriting failed, using raw query:", err.message);
    return query;
  }
}
