import { Mistral } from "@mistralai/mistralai";

// Check if the API key exists in the environment
if (!process.env.MISTRAL_API_KEY) {
  console.error("Error: MISTRAL_API_KEY environment variable is not set.");
  console.error("Please create a .env file and run node with the --env-file flag:");
  console.error("  node --env-file=.env mistral_chat.js");
  process.exit(1);
}

// Initialize the Mistral client
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function main() {
  try {
    const prompt = "Explain the difference between tokenization and embeddings in 2 sentences.";
    console.log(`Sending Prompt to Mistral: "${prompt}"\n`);

    const response = await client.chat.complete({
      model: "mistral-large-latest", // Standard Mistral model
      messages: [
        {
          role: "system",
          content: "You are a helpful, concise computer science tutor.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 150,
    });

    console.log("=== Response ===");
    console.log(response.choices[0].message.content);
    console.log();

    console.log("=== Token Usage Details ===");
    if (response.usage) {
      console.log(`Prompt Tokens:     ${response.usage.promptTokens}`);
      console.log(`Completion Tokens: ${response.usage.completionTokens}`);
      console.log(`Total Tokens:      ${response.usage.totalTokens}`);
    } else {
      console.log("No usage metadata returned.");
    }

  } catch (error) {
    console.error("An error occurred during the Mistral API call:", error.message);
  }
}

main();
