# Google Gemini API & Node.js SDK Deep Dive

Google's Gemini API is accessed via the modern `@google/genai` Node.js SDK. This guide covers client setup, request options, and how to read the complex multimodal response schema returned by Google.

---

## 🏗️ 1. Client Instantiation

To use Gemini, you import `GoogleGenAI` and instantiate it. The SDK automatically picks up the `GEMINI_API_KEY` from the environment if no parameters are supplied.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // Explicit configuration (optional if environment is set)
});
```

---

## 🛠️ 2. Request Configuration: `ai.models.generateContent`

Interactions are processed through `ai.models.generateContent(options)`. Key parameters include:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash", // Target model
  contents: "Explain machine learning in 10 words.", // String prompt or array for multimodal files
  config: {
    systemInstruction: "You are a helpful, concise assistant.", // Model persona
    temperature: 0.7,        // Creativity (0.0 = conservative, 2.0 = creative)
    maxOutputTokens: 100,    // Limits generated token counts
    topP: 0.95,              // Alternative randomness control
    topK: 40,                // Limits selections to the top K most likely tokens
    responseMimeType: "application/json", // Enforces structured JSON output
  }
});
```

---

## 📦 3. Raw Response Object Structure (JSON)

Gemini returns a nested schema containing content candidates, safety evaluations, and token counts. Here is the raw JSON shape of the response:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Computers learning patterns from data to make predictions automatically."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "safetyRatings": [
        {
          "category": "HARM_CATEGORY_HATE_SPEECH",
          "probability": "NEGLIGIBLE"
        },
        {
          "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
          "probability": "NEGLIGIBLE"
        },
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "probability": "NEGLIGIBLE"
        },
        {
          "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "probability": "NEGLIGIBLE"
        }
      ],
      "avgLogprobs": -0.12563
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 16,
    "candidatesTokenCount": 9,
    "totalTokenCount": 25
  }
}
```

---

## 🔍 4. Parsing the Response in JavaScript

The SDK provides convenient getters to extract content without digging manually through the candidates arrays.

### Accessing the Generated Text
Use the `.text` getter property. Under the hood, this loops through `candidates[0].content.parts` and joins the text fields together.
```javascript
const answerText = response.text;
console.log("Gemini Output:", answerText);
```

### Accessing the Finish Reason
```javascript
const finishReason = response.candidates[0].finishReason;
console.log("Finish Reason:", finishReason);
```
* **`STOP`**: Generated successfully and hit the stop sequence.
* **`MAX_TOKENS`**: Generation cut short by `maxOutputTokens`.
* **`SAFETY`**: Content generation blocked due to safety parameters.

### Accessing Token counts
Usage statistics are contained under `usageMetadata`. Note the camelCase property naming:
```javascript
if (response.usageMetadata) {
  console.log("Input Tokens Count:", response.usageMetadata.promptTokenCount);
  console.log("Output Tokens Count:", response.usageMetadata.candidatesTokenCount);
  console.log("Total Tokens Count:", response.usageMetadata.totalTokenCount);
}
```
