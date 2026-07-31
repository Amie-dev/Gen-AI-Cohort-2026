# Few-Shot Prompting

**Few-Shot Prompting** is a technique where you supply the Large Language Model (LLM) with one or more input-output pairs (exemplars) before asking it to generate a completion for the target query.

```
                      ┌───────────────────┐
[ Direct Instruction ]│                   │
[ Input-Output Ex. 1 ]│    LLM Engine     │
[ Input-Output Ex. 2 ]│                   │───────────────> [ Strict Completion ]
[ Target Input       ]│  (Pattern Match)  │  (Matches Exemplar Style)
      ───────────────>└───────────────────┘
```

## 🧠 Underlying Mechanism (In-Context Learning)
Few-shot prompting utilizes **In-Context Learning** (ICL). The exemplars temporarily align the attention mechanisms inside the model, mapping input text characteristics to specific output formatting and conceptual boundaries. This behavior happens purely inside the forward pass of the model and does not modify the model's weights.

## 🎯 Best Use Cases
1. **Strict Format Control**: Enforcing customized JSON schemas, markdown formats, or custom string structures.
2. **Text Classification with Edge Cases**: Classifying complex legal, medical, or technical documents where standard definitions are insufficient.
3. **Tone and Style Imitation**: Copying a brand voice, writing style, or specific punctuation format.
4. **Acronym and Translation Mappings**: Teaching custom vocabulary translation or proprietary company codes.

## 📝 Comprehensive Code Example
Below is an example of Few-Shot Prompting in Groq Node.js, enforcing custom key-value formatting:

```javascript
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const prompt = `
Task: Extract tech stack entities mentioned in the review and classify sentiment.
Format output strictly as: [ENTITIES: <comma-separated-entities>] | [SENTIMENT: <POSITIVE|NEGATIVE|NEUTRAL>]

Examples:
Input: "We migrated our Django API server to FastAPI, and our query latency dropped by 50%!"
Output: [ENTITIES: Django, FastAPI] | [SENTIMENT: POSITIVE]

Input: "We tried using MongoDB for our transactional banking ledger, and it was a complete disaster."
Output: [ENTITIES: MongoDB] | [SENTIMENT: NEGATIVE]

Input: "The team is currently evaluating Docker vs Podman for local containerization."
Output: [ENTITIES: Docker, Podman] | [SENTIMENT: NEUTRAL]

Input: "We built the dashboard in SvelteKit and deployed on Vercel, it feels incredibly snappy."
Output:
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Keep temperature low to prevent formatting drift
    });

    console.log("Few-Shot Output:\n", response.choices[0].message.content);
    // Expected output: [ENTITIES: SvelteKit, Vercel] | [SENTIMENT: POSITIVE]
  } catch (error) {
    console.error("Error:", error.message);
  }
}
main();
```

## ⚠️ Limitations & Failure Modes
* **Token Overhead**: Adding multiple examples increases the size of the prompt, consuming context window tokens and increasing cost/latency.
* **Exemplar Bias**: The model might become biased toward the labels or values shown in the examples. For instance, if all positive sentiment exemplars are about database migrations, the model may incorrectly associate all database migrations with positive sentiment.
* **Overfitting to Example Formats**: If formatting is overly rigid, the model might hallucinate keys or attributes present in the examples but absent in the target query.
