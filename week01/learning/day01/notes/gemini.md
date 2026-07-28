# Google Gemini API & Node.js SDK Guide

Google's Gemini models represent a state-of-the-art family of multimodal AI models, particularly notable for their extremely large context windows and native multimodality.

---

## 🌟 Key Strengths of Gemini

1. **Massive Context Windows**:
   * Gemini 1.5 & 2.0 models support context lengths up to **1 million to 2 million tokens** (compared to GPT-4's 128k or Llama 3's 128k).
   * This allows developers to pass entire codebases, long PDF books, hours of video, or raw databases directly into the prompt.
2. **Native Multimodality**:
   * Unlike models that use separate subsystems for image analysis or speech-to-text, Gemini is natively multimodal (trained on audio, video, image, and text at the same time).
3. **Google AI Studio Developer Tiers**:
   * Offers incredibly generous **free-of-charge limits** for developers to experiment and build prototypes directly.

---

## 📦 Setup & Dependency
Google's modern SDK is `@google/genai`. It replaces the older `@google/generative-ai` package to unify APIs across Python and Node.js.

```bash
npm install @google/genai
```

---

## 🗝️ API Key Configuration
Create a `.env` file and define:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key
```

Run your code using Node's native env flag:
```bash
node --env-file=.env gemini_chat.js
```

---

## 💻 Code Example

```javascript
import { GoogleGenAI } from "@google/genai";

// Instantiate the Gemini SDK
// It automatically retrieves GEMINI_API_KEY from process.env if left empty
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // Standard fast & cheap reasoning model
    contents: "What are the benefits of a native multimodal model?",
    config: {
      temperature: 0.7,
      maxOutputTokens: 250,
      systemInstruction: "You are a concise computer science professor."
    }
  });

  console.log("Response:", response.text);
  
  // Checking Token Usage Details
  if (response.usageMetadata) {
    console.log(`Prompt Tokens: ${response.usageMetadata.promptTokenCount}`);
    console.log(`Response Tokens: ${response.usageMetadata.candidatesTokenCount}`);
    console.log(`Total Tokens: ${response.usageMetadata.totalTokenCount}`);
  }
}

run();
```

---

## 🛠️ Key SDK Reference Options

* **`contents`**: The main user prompt (can be a string, or an array of objects incorporating text and media files/images).
* **`model`**: Supported options include:
  * `gemini-2.5-flash` (Recommended default: fast, cheap, highly capable)
  * `gemini-2.5-pro` (Highest quality reasoning, coding, and complex tasks)
  * `gemini-1.5-flash` / `gemini-1.5-pro` (Previous generation models)
* **`config.systemInstruction`**: Sets the persona or behavior rules for the model (similar to the system role in OpenAI).
* **`config.temperature`**: Controls randomness (0.0 for deterministic, 1.0 for creative).
* **`config.maxOutputTokens`**: Restricts response length.
