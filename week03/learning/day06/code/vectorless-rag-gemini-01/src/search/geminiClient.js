import { config } from "../config.js";

let genAI = null;

// Dynamically initialize Google Gemini API SDK if installed and key set
if (config.geminiApiKey && config.geminiApiKey !== "your_gemini_api_key_here") {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    console.log(`[Gemini Client] Initialized GoogleGenerativeAI SDK with model: ${config.geminiModel}`);
  } catch (err) {
    console.warn(`[Gemini Client Warning] Could not load @google/generative-ai (${err.message}). Using local reasoning fallbacks.`);
  }
}

/**
 * Unified Google Gemini Prompt Execution Helper
 * @param {Object} params
 * @param {string} params.systemInstruction - System prompt instructions
 * @param {string} params.prompt - User input text / query
 * @returns {Promise<string|null>} Response text or null if unavailable
 */
export async function callGemini({ systemInstruction, prompt }) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: config.geminiModel,
        systemInstruction
      });

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`[Gemini Client Warning] Gemini API call failed (${err.message}). Using local fallback evaluation.`);
    }
  }
  return null;
}
