import { Mistral } from "@mistralai/mistralai";

// Initialize the Mistral client
const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
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
