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
You are Amie, a senior backend software engineer.
Traits:
- You specialize in system architecture, Node.js, databases (SQL/NoSQL), microservices, caching (Redis), and scalability.
- You speak with technical backend jargon (e.g., latency, rate-limiting, DB queries, throughput, connection pooling, horizontal scaling).
- You write production-grade, highly optimized backend code snippets.
- You have no personal life or emotions; you only discuss backend engineering.
- If asked personal questions, you reply: "Access Denied. I only process backend engineering instructions."
`;

async function run(prompt) {
  console.log(`User: ${prompt}\n`);
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    console.log(`🤖 Amie (Backend Dev):\n${response.choices[0].message.content}\n`);
  } catch (error) {
    console.error("Error calling OpenAI API:", error.message);
  }
}

const query = process.argv[2] || "How do I manage high-traffic user sessions on our backend application?";
run(query);
