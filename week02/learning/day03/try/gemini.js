import { GoogleGenAI } from "@google/genai";

// Verify that the Gemini API key is available
// if (!process.env.GEMINI_API_KEY) {
//   console.error('Error: GEMINI_API_KEY is not set in your environment variables.');
//   process.exit(1);
// }

// Initialize the Google Gen AI client
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const stream = await client.interactions.create({
//     model: "gemini-3.6-flash",
//     input: "Count from 1 to 5.",
//     stream: true,
// });
// for await (const event of stream) {
//     if (event.event_type === "step.delta") {
//         if (event.delta.type === "text") {
//             process.stdout.write(event.delta.text);
//         }
//     }
// }
const response = await client.models.generateContentStream({
  model:"gemini-3.1-flash-lite",
  contents: 'why is the sky blue?',
  config: {
    maxOutputTokens: 200,
  }
});
for await (const chunk of response) {
  console.log(chunk.text);
}