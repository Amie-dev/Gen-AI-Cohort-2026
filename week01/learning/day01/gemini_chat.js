import { GoogleGenAI } from "@google/genai";

// Check if the API key exists in the environment
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  console.error("Please create a .env file and run node with the --env-file flag:");
  console.error("  node --env-file=.env gemini_chat.js");
  process.exit(1);
}

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const prompt = "Explain the difference between tokenization and embeddings in 2 sentences.";
    console.log(`Sending Prompt to Gemini: "${prompt}"\n`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Modern Gemini model
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    });

    console.log("=== Response ===");
    console.log(response.text);
    console.log();

    console.log("=== Usage Details ===");
    // Gemini SDK reports usage metadata
    if (response.usageMetadata) {
      console.log(`Prompt Tokens:     ${response.usageMetadata.promptTokenCount}`);
      console.log(`Candidates Tokens: ${response.usageMetadata.candidatesTokenCount}`);
      console.log(`Total Tokens:      ${response.usageMetadata.totalTokenCount}`);
    } else {
      console.log("No usage metadata returned.");
    }

  } catch (error) {
    console.error("An error occurred during the Gemini API call:", error.message);
  }
}

main();
