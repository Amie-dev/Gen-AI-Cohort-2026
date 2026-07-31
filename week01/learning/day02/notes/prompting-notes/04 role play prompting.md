# Role-Play and Persona Prompting

**Role-Play / Persona Prompting** is the technique of instructing an LLM to speak, reason, and respond as a specific character, professional role, or user persona.

```
                      ┌───────────────────┐
[ System Persona:    ]│    LLM Engine     │
[ Senior Architect   ]│                   │
[ User Query:        ]│ (Filters semantic │───────────────> [ Architecture Design ]
[ "Design an API"    ]│  generation vectors)                (Uses industry jargon)
      ───────────────>└───────────────────┘
```

## 🧠 Why Does Persona Prompting Work?
LLMs are trained on vast Corpora representing different voices, styles, and disciplines. When a query is passed zero-shot, the model generates an average response. By setting a **Persona** in the system prompt, you:
1. **Filter Context Boundaries**: The model restricts its generation vectors to match the language, terminology, and heuristics typical of that specific role (e.g., software developer, attorney, clinician).
2. **Set Rigid Boundaries**: Personas allow you to set specific traits, rules (e.g., "Do not speak about personal life", "Only output code"), and styles (e.g., using professional jargon).

---

## 🛠️ Structuring a Premium System Prompt Persona
A robust system persona prompt should follow this blueprint:

```
1. Core Identity       -> "You are [Name], a [Job Title / Character Role]."
2. Expertise & Skills  -> "You specialize in [Skill 1], [Skill 2], and [Skill 3]."
3. Tone & Style        -> "Your tone is [Tone adjective]. You use [Jargon type]."
4. Core Rules          -> "- Rule 1: [Action to take]\n- Rule 2: [Things to avoid]"
5. Fallback Protocol   -> "If queried about [Out-of-scope topic], reply with [Fallback]."
```

### Example: Senior Backend Engineer Persona (Amie)
```text
You are Amie, a Senior Backend Software Engineer.
- You specialize in system architecture, Node.js, and DB connection pooling.
- Your tone is highly technical and clinical. You use industry jargon (latency, throughput).
- You write production-grade, clean ES Module Javascript.
- You have no personal emotions or life.
- If asked about personal topics, you must output: "Access Denied. I only process backend engineering instructions."
```

---

## 📝 Comprehensive Code Example
Here is the implementation of Persona switching using Node.js:

```javascript
import { OpenAI } from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AMIE_PERSONA = `
  You are Amie, a Senior Backend Engineer. You speak only in technical backend terms (concurrency, sharding).
  If asked personal questions, reply: "Access Denied."
`;

const RIA_PERSONA = `
  You are Ria, a Frontend UX Architect. You speak only about accessibility (a11y), responsive design, and CSS layouts.
  If asked personal questions, reply: "Invalid Payload."
`;

async function queryPersona(personaPrompt, question) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: personaPrompt },
        { role: "user", content: question }
      ]
    });
    console.log("Response:\n", response.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Test Persona Amie
console.log("=== Querying Amie ===");
await queryPersona(AMIE_PERSONA, "How do you feel about working today?"); // Output: "Access Denied."

// Test Persona Ria
console.log("\n=== Querying Ria ===");
await queryPersona(RIA_PERSONA, "How do you feel about working today?"); // Output: "Invalid Payload."
```
