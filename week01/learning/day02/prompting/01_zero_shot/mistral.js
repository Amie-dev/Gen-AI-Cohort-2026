import { Mistral } from "@mistralai/mistralai";

// Initialize the Mistral client
const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const prompt = "what is 2+2 ?";

async function main() {
  try {
    const response = await client.chat.complete({
      model: "mistral-large-latest",
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
