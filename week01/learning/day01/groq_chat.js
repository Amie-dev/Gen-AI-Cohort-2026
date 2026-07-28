import Groq from "groq-sdk";

// Check if the API key exists in the environment
if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY environment variable is not set.");
  console.error("Please create a .env file and run node with the --env-file flag:");
  console.error("  node --env-file=.env groq_chat.js");
  process.exit(1);
}

// Initialize the Groq client
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const prompt = "Explain the difference between tokenization and embeddings in 2 sentences.";
    console.log(`Sending Prompt to Groq: "${prompt}"\n`);

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Very standard versatile Llama model on Groq
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
    if (response.usage) {
      console.log(`Prompt Tokens:     ${response.usage.prompt_tokens}`);
      console.log(`Completion Tokens: ${response.usage.completion_tokens}`);
      console.log(`Total Tokens:      ${response.usage.total_tokens}`);
    } else {
      console.log("No usage metadata returned.");
    }

  } catch (error) {
    console.error("An error occurred during the Groq API call:", error.message);
  }
}

main();
