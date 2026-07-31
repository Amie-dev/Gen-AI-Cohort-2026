# Chain of Thought (CoT) Prompting

**Chain of Thought (CoT) Prompting** is an engineering method that forces a Large Language Model to output a visible sequence of logical, intermediate reasoning steps before delivering the final answer.

```
                   ┌───────────────────┐
[ Complex Query ]  │    LLM Engine     │
[ "Think step-    ]│                   │───────────────> [ Reason Step 1 ]
[  by-step"     ]  │  (Allocates token │                 [ Reason Step 2 ]
      ────────────>│   budget to ICL   │                 [ Final Answer  ]
                   │    reasoning)     │
                   └───────────────────┘
```

## 🧠 Why Does CoT Work?
Unlike humans, LLMs do not "think before speaking." They generate output token-by-token. If a complex math or logic question is asked, a zero-shot prompt forces the model to predict the final answer token *immediately*. By instructing the model to show its work (e.g., "Let's think step-by-step"), you:
1. **Allocate Token Budget to Reasoning**: The model gets to generate dozens of intermediate tokens that serve as a working memory context for subsequent calculations.
2. **Expose Errors**: Breaking the problem down allows validation stages (either by the user, a parser, or another LLM) to check if a logical step went wrong.

---

## 🚀 CoT Methodologies

### 1. Zero-Shot CoT
Pioneered by Kojima et al. (2022), you append a simple trigger sentence like `"Let's think step by step."` or `"Work through this problem step-by-step to be sure you have the correct answer."` to the prompt.

### 2. Few-Shot CoT
Pioneered by Wei et al. (2022), you provide exemplars that show the detailed breakdown of a problem, helping the model emulate the exact structure of logical reasoning required.

---

## 🛠️ The State-Based Thoughts Pipeline
In our class, we implemented a custom state-based CoT loop. Instead of letting the model reason in free-form text, we constrained it to output structural steps in JSON format:

```
[User Input] ──> [INITIAL] ──> [THINK] ──> [ANALYZE] ──> [THINK/ANALYZE Loop] ──> [OUTPUT]
```

### JSON Step Definition
```json
{
  "step": "THINK" | "ANALYSE" | "OUTPUT",
  "text": "<reasoning explanation>"
}
```

* **`INITIAL`**: The model evaluates user intent.
* **`THINK`**: The model decides how to solve a sub-problem.
* **`ANALYZE`**: The model verifies if the calculation is correct.
* **`OUTPUT`**: The model provides the final response and exits the execution loop.

---

## 📝 Comprehensive Code Example
Here is the loop implementation using OpenAI SDK and a structured state-based CoT pipeline:

```javascript
import { OpenAI } from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
  You are an expert mathematician. Work step-by-step through a pipeline of "INITIAL", "THINK", "ANALYSE", and "OUTPUT".
  Format output strictly as a JSON object: { "step": "INITIAL"|"THINK"|"ANALYSE"|"OUTPUT", "text": "rational explanation" }
  Only output one JSON step per response.
`;

async function main(expression) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Solve the expression: ${expression}` }
  ];

  while (true) {
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" }
      });

      const rawContent = completion.choices[0].message.content;
      const parsed = JSON.parse(rawContent);

      // Record assistant's step in history
      messages.push({ role: "assistant", content: rawContent });
      console.log(`🤖 [${parsed.step}]: ${parsed.text}`);

      if (parsed.step === "OUTPUT") break;
      
      // Proactive delay between steps
      await new Promise(res => setTimeout(res, 1000));
    } catch (err) {
      console.error("Pipeline failure:", err.message);
      break;
    }
  }
}

main("2 + 2 - 5 * 10 / 3");
```
