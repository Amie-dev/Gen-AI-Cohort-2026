import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 3: Step-Back Prompting
 * Converts a specific question into a broader, higher-level conceptual background question.
 */
export async function createStepBackQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at Step-Back Prompting. Convert the user's specific query into a broader, " +
            "higher-level conceptual question about the underlying principles required to answer it. " +
            "Respond ONLY with the step-back question.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ Step-Back Query failed, returning raw query:", err.message);
    return query;
  }
}
