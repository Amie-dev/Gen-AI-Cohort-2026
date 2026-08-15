import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 11: Re-Ranking Layer
 * Re-ranks candidates by computing deep semantic relevance against the query.
 */
export async function rerank(query, candidates) {
  if (candidates.length <= 1) return candidates;

  try {
    const promptPayload = candidates.map((c, i) => `[Doc ${i}] (ID: ${c.id})\n${c.text}`).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reranking",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              rankedDocIds: {
                type: "array",
                description: "Doc IDs ordered by relevance to the query (highest first).",
                items: { type: "string" },
              },
            },
            required: ["rankedDocIds"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a semantic re-ranker. Given a user query and candidate documents, " +
            "evaluate each document's exact relevance and return an ordered list of doc IDs from most to least relevant.",
        },
        { role: "user", content: `Query: ${query}\n\nCandidates:\n${promptPayload}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const rankedIds = parsed.rankedDocIds || [];

    const map = new Map(candidates.map((c) => [c.id, c]));
    const reranked = [];

    for (const id of rankedIds) {
      if (map.has(id)) {
        reranked.push(map.get(id));
        map.delete(id);
      }
    }

    // Append remaining candidates that were not in the re-rank list
    return [...reranked, ...map.values()];
  } catch (err) {
    console.error("⚠️ Re-ranking failed, keeping RRF order:", err.message);
    return candidates;
  }
}
