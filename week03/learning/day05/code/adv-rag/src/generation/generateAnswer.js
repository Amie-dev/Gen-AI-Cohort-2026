import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 13: Grounded Answer Generation
 * Generates an answer strictly grounded in the retrieved context.
 */
export async function generateAnswer(query, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a production grounded assistant. " +
            "Answer the user's question using ONLY the provided context.\n\n" +
            "Rules:\n" +
            "- Do not invent facts or extrapolate beyond provided context.\n" +
            "- If context is insufficient to answer completely, state clearly what is missing.\n" +
            "- Cite source numbers [SOURCE N] when referring to specific facts.\n" +
            "- Be concise, direct, and professional.",
        },
        {
          role: "user",
          content: `Question:\n${query}\n\nContext:\n${context}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || "Unable to generate answer.";
  } catch (err) {
    console.error("⚠️ Grounded Generation error:", err.message);
    return "Error generating response from LLM service.";
  }
}
