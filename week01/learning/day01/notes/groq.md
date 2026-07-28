# Groq API & Node.js SDK Deep Dive

Groq utilizes specialized LPU (Language Processing Unit) hardware to achieve ultra-fast LLM inference. Its SDK mirrors OpenAI's structure, but the response object includes Groq-specific hardware statistics.

---

## 🏗️ 1. Client Instantiation

To use Groq, import the default export `Groq` from the `groq-sdk` package.

```javascript
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Reads from environment
});
```

---

## 🛠️ 2. Request Configuration: `client.chat.completions.create`

Because Groq implements an OpenAI-compatible interface, the parameters match the OpenAI specification:

```javascript
const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile", // Target open-weights model hosted on Groq
  messages: [
    { role: "system", content: "You are a concise engineering assistant." },
    { role: "user", content: "How many LPUs are usually run together?" }
  ],
  temperature: 0.2,      // Low temperature for factual consistency
  max_tokens: 150,       // Upper bound token limits
  stream: false,         // Supports real-time token streaming
});
```

---

## 📦 3. Raw Response Object Structure (JSON)

Groq's response body contains the same structure as OpenAI, with an extended `x_groq` block inside the response object (containing hardware-level inference speed metadata):

```json
{
  "id": "chatcmpl-923f5b2d-fba1-4b13-a4c3-bca978ab12e0",
  "object": "chat.completion",
  "created": 1719598400,
  "model": "llama-3.3-70b-versatile",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Groq LPUs are designed to scale linearly, meaning multiple LPUs are connected in networks (often 8, 16, or more chips per chassis) to support large models like Llama 3 70B."
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "queue_time": 0.0012,
    "prompt_tokens": 28,
    "prompt_time": 0.005,
    "completion_tokens": 42,
    "completion_time": 0.084,
    "total_tokens": 70,
    "total_time": 0.089
  },
  "x_groq": {
    "id": "req_01j1example"
  }
}
```

---

## 🔍 4. Parsing the Response in JavaScript

Use the standard properties to extract text output and finish statuses, along with Groq's custom processing speed fields.

### Accessing the Text Response
```javascript
const textOutput = response.choices[0].message.content;
console.log("Groq Answer:", textOutput);
```

### Accessing the Finish Reason
```javascript
const reason = response.choices[0].finish_reason;
console.log("Finish Reason:", reason); // "stop" or "length"
```

### Accessing Detailed Token & Performance Stats
In addition to token numbers, Groq logs latency metrics inside the `usage` block. This allows you to compute the exact speed (Tokens per Second):
```javascript
if (response.usage) {
  const promptTokens = response.usage.prompt_tokens;
  const completionTokens = response.usage.completion_tokens;
  const completionTime = response.usage.completion_time; // in seconds
  
  // Calculate tokens per second (Inference Speed)
  const tokensPerSec = completionTokens / completionTime;

  console.log(`Prompt Tokens: ${promptTokens}`);
  console.log(`Completion Tokens: ${completionTokens}`);
  console.log(`Speed: ${tokensPerSec.toFixed(2)} tokens/sec`);
  console.log(`Queue Delay: ${(response.usage.queue_time * 1000).toFixed(2)} ms`);
}
```
