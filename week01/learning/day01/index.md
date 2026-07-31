# 📂 Day 01: API Platforms & Multi-SDKs

This directory contains the learning files, scripts, and notes for **Day 01** of the Gen AI JS Cohort.

## 📋 Table of Contents

### 1. Integration Scripts
These scripts show how to initialize API clients, handle requests/responses, stream tokens, and extract usage statistics for different LLM platforms.
* **[openai_chat.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/openai_chat.js)**: OpenAI client completion.
* **[gemini_chat.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/gemini_chat.js)**: Google Gemini SDK integration.
* **[groq_chat.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/groq_chat.js)**: Groq SDK integration.
* **[mistral_chat.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/mistral_chat.js)**: Mistral SDK integration.
* **[index.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/index.js)**: Default test runner.

### 2. Lecture & Study Notes
Located under **[notes/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/)**:
* **[notes.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/notes.md)**: Main lecture summary.
* **[open ai.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/open%20ai.md)**: Details on OpenAI SDK setup.
* **[gemini.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/gemini.md)**: Details on Google AI Studio parameters.
* **[groq.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/groq.md)**: Details on Llama models on Groq Cloud.
* **[mistral.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/mistral.md)**: Details on Mistral Large completions.
* **[role.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day01/notes/role.md)**: Detailed breakdown of conversational API roles (System, User, Assistant).

## 🚀 Running the Scripts
Ensure you have set the appropriate API keys in the **[.env](file:///home/aminul/development/gen-ai-cohort/.env)** file in the root workspace, and execute using:
```bash
# E.g. to run Gemini chat:
node --env-file=.env week01/learning/day01/gemini_chat.js
```
