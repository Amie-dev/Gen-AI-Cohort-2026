import { OpenAI } from "openai";

// Ensure the OpenAI API key is present
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a Senior Software Engineer and Tech Mentor.
Your role:
1. Answer any question related to software development or technology clearly and educationally.
2. Structure your response with an explanation, code examples where applicable, and industry best practices.
3. At the end of every answer, recommend 2-3 specific topics or video searches on YouTube that will help the user master this concept (e.g., recommend channel channels like "Chai aur Code", "freeCodeCamp", "Traversy Media", or specific video search queries with URL formats like https://www.youtube.com/results?search_query=...).
`;

async function run(prompt) {
  console.log(`User Query: ${prompt}\n`);
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    console.log(`🤖 Tech Advisor Response:\n${response.choices[0].message.content}\n`);
  } catch (error) {
    console.error("Error calling OpenAI API:", error.message);
  }
}

const query = process.argv[2] || "Explain what prompt engineering is and what are the best practices.";
run(query);
