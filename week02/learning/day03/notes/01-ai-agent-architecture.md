# AI Agent Architecture

This note covers the fundamentals of AI Agents, their comparison to LLMs, and their architecture components.

---

## 1. What is an AI Agent?

An **AI Agent** is an intelligent software system built on top of a Large Language Model (LLM). Instead of only generating text, an AI Agent can:

* Think through a task
* Follow instructions
* Use external tools (search the web, read databases, execute code)
* Remember previous conversations (memory)
* Retry failed operations
* Make decisions based on rules

> **Summary:** An LLM is the **brain**, while the AI Agent is the **complete worker**.

---

## 2. LLM vs AI Agent

```text
           User
             │
             ▼
      ┌────────────┐
      │ AI Agent   │
      └────────────┘
       │     │
       │     ├────────► Tools
       │
       ├────────► Memory
       │
       ├────────► Guardrails
       │
       ├────────► System Prompt
       │
       └────────► LLM
```

* **The LLM:** Generates text based on prompts.
* **The Agent:** Manages everything around the LLM, including routing inputs, maintaining state, calling tools, and applying constraints.

---

## 3. Why LLMs Alone Are Not Enough

Calling an LLM directly works for simple chat applications. However, production applications require a much more robust harness:

* **Authentication:** Checking user permissions.
* **Retry logic:** Handling rate limits or transient server errors.
* **Tool execution:** Securely executing APIs or database operations.
* **Memory:** Persisting context across user sessions.
* **Validation:** Ensuring outputs conform to expected schemas.
* **Security & Guardrails:** Protecting against prompt injection and jailbreaks.

Because of this, developers build a **harness** or use an **Agent SDK** around the LLM.

---

## 4. Orchestration Layer

An **Orchestration Layer** manages the complete workflow between users, tools, APIs, and the LLM.

### Responsibilities:
- Calling tools and integrating their results back into the model context.
- Managing prompt templates and variables.
- Handling retries and model fallback routing.
- Maintaining memory storage (short-term and long-term).
- Combining and formatting responses for the end user.
- Recovering from execution errors.

---

## 5. System Prompts & Instructions

### Instructions
Instructions tell the model how it should behave.
```text
You are an expert JavaScript teacher.
Explain everything using beginner-friendly examples.
Never answer in more than 200 words.
```

### System Prompt
The **System Prompt** is the base instruction wrapper that defines the AI's personality, behavior, rules, and security boundaries.
```text
You are a senior software engineer.
Always answer professionally.
Never generate harmful content.
Use Markdown formatting.
```

---

## 6. Tools

LLMs are frozen in time and cannot directly interact with the physical world or live systems. Instead, they use **Tools** via an agentic loop:

* **Web Search:** Fetching live data.
* **Calculator:** Doing precise mathematical evaluations.
* **Databases (SQL/NoSQL):** Storing and querying persistent data.
* **APIs:** Sending emails, posting to Slack, interacting with GitHub.
* **File System:** Reading and writing files.

---

## 7. Guardrails

Guardrails are safety mechanisms that control AI behavior, shielding both the model from malicious inputs and the user from bad outputs.

### Input Guardrails
Validate user input *before* sending it to the model:
* Block prompt injections (e.g., "Ignore previous instructions").
* Screen out abusive or unsafe language.
* Redact personally identifiable information (PII).
* Validate input formats.

### Output Guardrails
Validate responses *after* generation:
* Ensure output matches structured formats (like JSON/Zod schemas).
* Detect and flag hallucinations or fabrications.
* Screen out sensitive, toxic, or out-of-bounds answers.

---

## 8. Human in the Loop (HITL)

For critical or high-risk operations, an agent should not make the final decision autonomously. Instead, a human operator must review and authorize actions:

* **High-risk domains:** Medical diagnosis, legal contracts, financial transactions.
* **Destructive actions:** Deleting data, sending client-facing emails, triggering builds.

```text
AI Suggestion ──> Human Approval ──> Final Action
```
