import { OpenAI } from "openai"

// Initialize the OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompt=
`
what is 2+2 ?
Do not add anything else in answer , take sample from the example
examples:
 - what is 2+3
  expected output:5(five)

- what 5+4 ?
  expected output:9 (nine)

`

async function main() {
  const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective modern model
      messages: [
       
        {
          role: "user",
          content: prompt,
        },
      ],
     
    });
    console.log(response.choices[0].message.content);
}
main()