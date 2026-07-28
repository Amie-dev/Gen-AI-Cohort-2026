# Mistral AI API & Node.js SDK Deep Dive

Mistral AI provides efficient commercial and open-weights models. Its Node.js SDK (`@mistralai/mistralai`) supports the standard chat completion pattern but features some unique naming specifications.

---

## 🏗️ 1. Client Instantiation

To use Mistral AI, import `Mistral` and initialize it with your API key.

```javascript
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY, // Configured via environment variable
});
```

---

## 🛠️ 2. Request Configuration: `client.chat.complete`

Note that the method name in the Mistral SDK is **`chat.complete`** (not `chat.completions.create`). Furthermore, parameters like max tokens use camelCase (**`maxTokens`**):

```javascript
const response = await client.chat.complete({
  model: "mistral-large-latest", // Primary flagship reasoning model
  messages: [
    { role: "system", content: "You are an expert coder." },
    { role: "user", content: "Explain big-O notation." }
  ],
  temperature: 0.7,        // Randomness (0.0 to 1.0)
  maxTokens: 150,          // Maximum generated tokens (uses camelCase)
  safePrompt: true,        // Enables Mistral's built-in safety moderation filter
});
```

---

## 📦 3. Raw Response Object Structure (JSON)

When Mistral's API processes the completion, it returns a JSON response object. Here is its detailed shape under the hood:

```json
{
  "id": "mst-987a654b-321c-4321-b123-abcdef123456",
  "object": "chat.completion",
  "created": 1719598600,
  "model": "mistral-large-latest",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Big-O notation is a mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity. In computer science, it is used to classify algorithms according to how their run time or space requirements grow as the input size grows."
      },
      "finishReason": "stop"
    }
  ],
  "usage": {
    "promptTokens": 24,
    "completionTokens": 56,
    "totalTokens": 80
  }
}
```

---

## 🔍 4. Parsing the Response in JavaScript

Extract data from Mistral's response payload using properties that mirror the API structure. Note the camelCase properties for `finishReason` and token counts inside `usage`:

### Accessing the Text Response
The text resides inside the choice's message content.
```javascript
const outputText = response.choices[0].message.content;
console.log("Mistral Answer:", outputText);
```

### Accessing the Finish Reason
Find the termination code via `finishReason` (camelCase):
```javascript
const stopReason = response.choices[0].finishReason;
console.log("Finish Reason:", stopReason); // "stop" or "length"
```

### Accessing Token counts
In Mistral's usage metadata, the token counts use camelCase keys:
```javascript
if (response.usage) {
  console.log("Input Tokens count:", response.usage.promptTokens);
  console.log("Output Tokens count:", response.usage.completionTokens);
  console.log("Total Tokens count:", response.usage.totalTokens);
}
```
