# Groq API & Node.js SDK Guide

Groq is an AI infrastructure company that has developed a custom chip called the **Language Processing Unit (LPU)**. Unlike general-purpose GPUs, LPUs are specialized for the sequential nature of LLMs, enabling blazing-fast token generation.

---

## 🌟 Key Strengths of Groq

1. **Ultra-Low Latency**:
   * Generates text at **500+ tokens per second** (compared to 30–80 tokens per second on typical GPU clouds).
   * Perfect for conversational agents, voice-to-voice interfaces, real-time typing indicators, and prompt-chaining workflows.
2. **Access to Top Open-Source Models**:
   * Hosts high-performing open-weights models like Meta's **Llama 3 / 3.1 / 3.3** and Mistral's **Mixtral**.
3. **Cost-Effective**:
   * Extremely low pricing per million tokens because of their high-efficiency custom hardware.

---

## 📦 Setup & Dependency
Groq provides an official Node.js SDK (`groq-sdk`), which has an API design extremely similar to OpenAI's SDK (using the chat completion standards).

```bash
npm install groq-sdk
```

---

## 🗝️ API Key Configuration
Define the key in `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key
```

Run your code using Node's native env flag:
```bash
node --env-file=.env groq_chat.js
```

---

## 💻 Code Example

```javascript
import Groq from "groq-sdk";

// Initialize the Groq client
// It automatically retrieves GROQ_API_KEY from process.env if left empty
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile", // Top tier reasoning model on Groq
    messages: [
      {
        role: "system",
        content: "You are a concise, ultra-helpful computer science tutor."
      },
      {
        role: "user",
        content: "What makes Groq's hardware different from traditional GPUs?"
      }
    ],
    temperature: 0.5,
    max_tokens: 150
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

* **`model`**: Supported models on Groq include:
  * `llama-3.3-70b-versatile` (Llama 3.3 70B: High quality reasoning, coding)
  * `llama-3.1-8b-instant` (Llama 3.1 8B: Blazing fast speed, ideal for simple processing)
  * `mixtral-8x7b-32768` (Mixtral 8x7B: Good performance and handles up to 32k context)
* **`messages`**: Standard OpenAI format array (`role: "system" | "user" | "assistant"`, `content: "..."`).
* **`temperature`**: Control creativity/randomness (0.0 = deterministic, 1.0 = creative).
