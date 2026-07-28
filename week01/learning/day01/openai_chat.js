import { OpenAI } from "openai";

// Check if the API key exists in the environment
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set.");
  console.error("Please create a .env file and run node with the --env-file flag:");
  console.error("  node --env-file=.env openai_chat.js");
  process.exit(1);
}

// Initialize the OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const prompt = "Explain the difference between tokenization and embeddings in 2 sentences.";
    console.log(`Sending Prompt: "${prompt}"\n`);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective modern model
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
      max_tokens: 150,
    });

    console.log("=== Response ===");
    console.log(response.choices[0].message.content);
    console.log();

    console.log("=== Token Usage Details ===");
    console.log(`Prompt Tokens:     ${response.usage.prompt_tokens}`);
    console.log(`Completion Tokens: ${response.usage.completion_tokens}`);
    console.log(`Total Tokens:      ${response.usage.total_tokens}`);

  } catch (error) {
    console.error("An error occurred during the API call:", error.message);
  }
}

main();
