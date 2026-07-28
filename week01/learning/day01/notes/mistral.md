# Mistral AI API & Node.js SDK Guide

Mistral AI is a Paris-based AI company famous for developing highly efficient open-weights LLMs that rival proprietary models in reasoning, multilingual understanding, and code generation.

---

## 🌟 Key Strengths of Mistral AI

1. **Open-Weights Leader**:
   * Mistral releases many model weights (e.g., Mistral 7B, Mixtral 8x7B, Mistral Nemo) to the public, allowing organizations to self-host, customize, and run them locally.
2. **European Data Governance**:
   * As a European company, Mistral offers strict adherence to European data safety standards and compliance (critical for GDPR-sensitive enterprise applications).
3. **Multilingual Excellence**:
   * Mistral models are specifically optimized for multilingual tasks out of the box, speaking French, German, Spanish, Italian, and English fluently.

---

## 📦 Setup & Dependency
Mistral uses the official `@mistralai/mistralai` SDK package.

```bash
npm install @mistralai/mistralai
```

---

## 🗝️ API Key Configuration
Define the key in `.env`:
```env
MISTRAL_API_KEY=your_mistral_console_api_key
```

Run your code using Node's native env flag:
```bash
node --env-file=.env mistral_chat.js
```

---

## 💻 Code Example

```javascript
import { Mistral } from "@mistralai/mistralai";

// Initialize the Mistral client
// It automatically retrieves MISTRAL_API_KEY from process.env if left empty
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function run() {
  const response = await client.chat.complete({
    model: "mistral-large-latest", // Mistral's flagship commercial model
    messages: [
      {
        role: "system",
        content: "You are a concise, helpful assistant."
      },
      {
        role: "user",
        content: "Explain the philosophy of open-weights models."
      }
    ],
    temperature: 0.7,
    maxTokens: 150
  });

  console.log("Response:", response.choices[0].message.content);
  
  // Extracting Usage Details
  if (response.usage) {
    console.log(`Prompt Tokens: ${response.usage.promptTokens}`);
    console.log(`Response Tokens: ${response.usage.completionTokens}`);
    console.log(`Total Tokens: ${response.usage.totalTokens}`);
  }
}

run();
```

---

## 🛠️ Key SDK Reference Options

* **`model`**: Supported models on Mistral Console include:
  * `mistral-large-latest` ( flagship commercial model, rivals GPT-4)
  * `mistral-small-latest` (Cost-effective fast reasoning model)
  * `open-mistral-7b` / `open-mixtral-8x22b` (Standard open-weights models)
* **`messages`**: Standard chat completion format array.
* **`temperature`**: Controls randomness (range 0.0 to 1.0).
* **`maxTokens`**: Restricts the maximum output token length (note: CamelCase `maxTokens` in the official Mistral SDK).
