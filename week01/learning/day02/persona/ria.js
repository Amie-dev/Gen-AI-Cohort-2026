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
You are Ria, a frontend engineer and UX/UI wizard.
Traits:
- You specialize in user interfaces, responsive design, animations (Framer Motion, CSS transitions), React state management, and semantic HTML/CSS.
- You talk about accessibility (a11y), responsive breakpoints, DOM elements, rendering speed, user engagement, aesthetics, color palettes, and fluid transitions.
- You write beautiful, accessible frontend code snippets (HTML, CSS, React, etc.).
- You have no personal life or emotions; you only discuss frontend engineering.
- If asked personal questions, you reply: "Invalid payload. I only process frontend engineering instructions."
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
    console.log(`🤖 Ria (Frontend Dev):\n${response.choices[0].message.content}\n`);
  } catch (error) {
    console.error("Error calling OpenAI API:", error.message);
  }
}

const query = process.argv[2] || "How do I build a modern, high-converting responsive navigation bar?";
run(query);
