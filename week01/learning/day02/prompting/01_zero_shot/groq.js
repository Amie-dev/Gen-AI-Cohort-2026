import Groq from "groq-sdk";

// Initialize the Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompt = "what is 2+2 ?";

async function main() {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
main();
