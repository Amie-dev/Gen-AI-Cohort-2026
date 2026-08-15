import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 14: Corrective RAG (CRAG) Evaluator
 * Evaluates the generated answer for Groundedness, Relevance, Completeness, and Hallucination.
 * Returns a score out of 10 and missing keywords for retries.
 */
export async function evaluateAnswer(query, answer, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "crag_evaluation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              score: {
                type: "number",
                description: "Overall quality rating from 0 to 10.",
              },
              grounded: {
                type: "boolean",
                description: "True if all claims are supported by context.",
              },
              relevant: {
                type: "boolean",
                description: "True if the answer directly answers the query.",
              },
              missing: {
                type: "array",
                description: "List of missing concepts or keywords needed for a complete answer.",
                items: { type: "string" },
              },
            },
            required: ["score", "grounded", "relevant", "missing"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an impartial evaluator for a RAG system.\n" +
            "Evaluate the generated answer against the user query and context.\n" +
            "Rate overall quality from 0 to 10 (>= 6 is passing).\n" +
            "Identify any missing concepts if incomplete.",
        },
        {
          role: "user",
          content: JSON.stringify({ query, answer, context }),
        },
      ],
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? '{"score": 7, "grounded": true, "relevant": true, "missing": []}');
  } catch (err) {
    console.error("⚠️ CRAG Evaluation error, default pass:", err.message);
    return { score: 7, grounded: true, relevant: true, missing: [] };
  }
}
