import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const prompt = `
what is 2+2 ?
Do not add anything else in answer , take sample from the example
examples:
 - what is 2+3
  expected output:5(five)

- what 5+4 ?
  expected output:9 (nine)
`;

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log(response.text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
main();
