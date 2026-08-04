import OpenAI from "openai";


// Verify that the Gemini API key is available
if (!process.env.MESH_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in your environment variables.');
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://api.meshapi.ai/v1",
  apiKey: process.env.MESH_API_KEY
});



async function main() {
  try {
    const prompt = "Explain the difference between tokenization and embeddings in 2 sentences.";
    console.log(`Sending Prompt: "${prompt}"\n`);

    const response = await client.chat.completions.create({
      model: "google/gemini-2.5-flash-lite", // Cost-effective modern model
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