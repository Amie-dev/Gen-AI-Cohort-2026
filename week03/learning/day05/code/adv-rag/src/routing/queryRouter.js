import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 6: Query Routing
 * Routes a query to the appropriate data store (AUTH_DB, VECTOR_DB, S3, MULTI_STORE).
 */
export async function routeQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "query_routing",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              targetStore: {
                type: "string",
                enum: ["AUTH_DB", "VECTOR_DB", "S3", "MULTI_STORE"],
                description: "Selected data store route.",
              },
              reasoning: {
                type: "string",
                description: "Justification for route selection.",
              },
            },
            required: ["targetStore", "reasoning"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an enterprise query router.\n" +
            "- AUTH_DB: User account, billing, current plan, status, payment.\n" +
            "- VECTOR_DB: General documentation, conceptual questions, TDZ, code, policies.\n" +
            "- S3: Invoice download, PDFs, asset files.\n" +
            "- MULTI_STORE: Requests requiring user account data AND documentation/policy details.",
        },
        { role: "user", content: query },
      ],
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? '{"targetStore":"VECTOR_DB"}');
  } catch (err) {
    console.error("⚠️ Query Routing failed, default to VECTOR_DB:", err.message);
    return { targetStore: "VECTOR_DB", reasoning: "Fallback default" };
  }
}
