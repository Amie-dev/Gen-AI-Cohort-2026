# OpenAI API & Node.js SDK Guide

OpenAI is the pioneer of modern Generative AI API accessibility. Their GPT models represent the benchmark for performance, developer tooling, and reliable structured outputs.

---

## 🌟 Key Strengths of OpenAI

1. **Industry Standard**:
   * The `openai` NPM package and API structure are the industry-wide specifications. Many alternative model hosts (like Groq, DeepSeek, LocalLLMs) support OpenAI-compatible endpoint configurations.
2. **GPT-4o (Omni) Performance**:
   * Flagship models feature leading reasoning, high-speed output, and native support for text, vision, and voice.
3. **Structured Outputs**:
   * Offers highly reliable JSON Schema enforcement (using the `response_format` configuration) to guarantee outputs fit database schemas without parser errors.

---

## 📦 Setup & Dependency
OpenAI provides the official `openai` Node.js library.

```bash
npm install openai
```

---

## 🗝️ API Key Configuration
Define the key in `.env`:
```env
OPENAI_API_KEY=sk-proj-your_openai_api_key
```

Run your code using Node's native env flag:
```bash
node --env-file=.env openai_chat.js
```

---

## 💻 Code Example

```javascript
import { OpenAI } from "openai";

// Initialize the OpenAI client
// It automatically retrieves OPENAI_API_KEY from process.env if left empty
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini", // Cost-effective default model
    messages: [
      {
        role: "system",
        content: "You are a helpful, concise assistant."
      },
      {
        role: "user",
        content: "Explain tokenization in one sentence."
      }
    ],
    temperature: 0.7,
    max_tokens: 100
  });

  console.log("Response:", response.choices[0].message.content);
  
  // Extracting Usage Details
  if (response.usage) {
    console.log(`Prompt Tokens: ${response.usage.prompt_tokens}`);
    console.log(`Response Tokens: ${response.usage.completion_tokens}`);
    console.log(`Total Tokens: ${response.usage.total_tokens}`);
  }
}

run();
```

---

## 🛠️ Key SDK Reference Options

* **`model`**: Supported models include:
  * `gpt-4o-mini` (Recommended default: fast, cheap, highly intelligent)
  * `gpt-4o` (Flagship omni model with advanced logic and vision capabilities)
  * `o1-mini` / `o1-preview` (Advanced reasoning and multi-step math/logic models)
* **`messages`**: Message history array containing:
  * `role: "system" | "user" | "assistant"`
  * `content: "..."`
* **`temperature`**: Control creativity (0.0 to 2.0).
* **`max_tokens`**: Restricts the maximum output token length.
