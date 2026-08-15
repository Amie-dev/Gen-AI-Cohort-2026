import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 4: Sub-Query Decomposition
 * Decomposes a multi-faceted query into 3-5 focused independent retrieval questions.
 */
export async function createSubQueries(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sub_query_decomposition",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              queries: {
                type: "array",
                description: "Array of 3 to 5 independent sub-queries.",
                items: { type: "string" },
              },
            },
            required: ["queries"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Decompose the user's question into 3-5 independent, focused retrieval sub-queries. Respond ONLY with structured JSON.",
        },
        { role: "user", content: query },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Array.isArray(parsed.queries) ? parsed.queries : [query];
  } catch (err) {
    console.error("⚠️ Sub-Query Decomposition failed:", err.message);
    return [query];
  }
}
