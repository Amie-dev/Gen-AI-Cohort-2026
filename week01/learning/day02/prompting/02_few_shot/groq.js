import Groq from "groq-sdk";

// Initialize the Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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
