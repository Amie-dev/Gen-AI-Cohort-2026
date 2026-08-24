import OpenAI from "openai";
import { config } from "../config.js";

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Smart Fallback LLM responses for offline execution
 */
function getMockLLMResponse(systemPrompt, userPrompt) {
  const sysLower = systemPrompt.toLowerCase();
  const userLower = userPrompt.toLowerCase();

  // 1. Query Translator Mock
  if (sysLower.includes("query translator") || sysLower.includes("query translation")) {
    return JSON.stringify({
      rewritten: userPrompt.replace(/(please|can you|tell me|i want to know)/gi, "").trim() + " detailed architecture",
      stepBack: "What are the core concepts and fundamental mechanics related to this query?",
      subQueries: [
        `What is the primary definition of ${userPrompt.slice(0, 25)}?`,
        `What are the production best practices for ${userPrompt.slice(0, 25)}?`
      ],
      hydeDocument: `Comprehensive technical documentation explaining ${userPrompt}. Key concepts include design patterns, state management, latency tuning, and fault tolerance.`
    });
  }

  // 2. Fact Extraction Mock
  if (sysLower.includes("fact extraction") || sysLower.includes("extract facts")) {
    const facts = [];
    if (userLower.includes("my name is")) {
      const match = userPrompt.match(/my name is ([a-zA-Z]+)/i);
      if (match) facts.push({ fact: `User's name is ${match[1]}`, category: "personal" });
    }
    if (userLower.includes("prefer") || userLower.includes("love") || userLower.includes("like") || userLower.includes("favorite")) {
      facts.push({ fact: `User preference: ${userPrompt}`, category: "preference" });
    }
    if (userLower.includes("work at") || userLower.includes("working on") || userLower.includes("developer")) {
      facts.push({ fact: `User work/context: ${userPrompt}`, category: "professional" });
    }
    if (facts.length === 0) {
      facts.push({ fact: `User discussed: ${userPrompt.slice(0, 40)}`, category: "general" });
    }
    return JSON.stringify({ extractedFacts: facts });
  }

  // 3. CRAG Evaluator Mock
  if (sysLower.includes("crag") || sysLower.includes("evaluator")) {
    return JSON.stringify({
      score: 8.5,
      isSufficient: true,
      reasoning: "Retrieved context directly addresses the key technical entities and queries."
    });
  }

  // 4. Memory Reflection Mock
  if (sysLower.includes("reflection") || sysLower.includes("dreaming")) {
    return JSON.stringify({
      mergedFacts: [],
      contradictionsResolved: [],
      evictIds: []
    });
  }

  // 5. General Generation Default Mock
  return `Based on your query "${userPrompt}" and the retrieved knowledge context, here is a synthesized answer:
The system integrates Short-Term Memory, Long-Term Fact Memory (Vector RAG), and Knowledge Base Document RAG to deliver accurate, personalized, and context-aware responses.`;
}

/**
 * General LLM Generation Call
 */
export async function callLLM(systemPrompt, userPrompt, temperature = 0.2) {
  if (openaiClient && config.llmProvider === "openai") {
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature,
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.warn(`[LLM Warning] OpenAI API call failed, using mock response: ${err.message}`);
    }
  }

  return getMockLLMResponse(systemPrompt, userPrompt);
}

/**
 * LLM Call returning parsed JSON
 */
export async function generateJSON(systemPrompt, userPrompt) {
  const rawText = await callLLM(systemPrompt, userPrompt, 0.1);
  try {
    // Clean markdown code fence if present
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn(`[JSON Parse Warning] Failed to parse JSON response, attempting fallback parse.`);
    return JSON.parse(getMockLLMResponse(systemPrompt, userPrompt));
  }
}
