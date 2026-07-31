# 📂 Day 02: Prompt Engineering & Loop Architectures

This directory contains the learning files, scripts, assignments, and notes for **Day 02** of the Gen AI JS Cohort.

## 📋 Table of Contents

### 1. Interactive Persona Assignments
Located under **[persona/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/persona/)**:
* **[amie.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/persona/amie.js)**: Senior Backend Developer persona query runner.
* **[ria.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/persona/ria.js)**: Frontend UX/UI Architect persona query runner.
* **[tech_advisor.js](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/persona/tech_advisor.js)**: Tech Support persona that recommends relevant YouTube resources.

### 2. Prompting Strategy Implementations
Located under **[prompting/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/)**:
* **[01_zero_shot/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/01_zero_shot/)**: Zero-Shot prompting setups for OpenAI, Gemini, Groq, and Mistral.
* **[02_few_shot/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/02_few_shot/)**: Few-Shot prompting setups showing format and structure constraint matching.
* **[03_COT/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/03_COT/)**: Chain-of-thought pipelines utilizing sequential step loops.
* **[03_COT_TOOLS/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/03_COT_TOOLS/)**: CoT agents connected to real-time weather APIs and CLI command execution.
* **[04_Role_Play/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/prompting/04_Role_Play/)**: Multi-SDK Agent loops integrated with 429 and 503 retry mechanisms.

### 3. Lecture & Study Notes
Located under **[notes/](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/)**:
* **[row-class.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/row-class.md)**: Main lecture summary and links directory.
* **[01 zero short prompting.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/prompting-notes/01%20zero%20short%20prompting.md)**: Direct instruction concepts.
* **[02 few short prompting.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/prompting-notes/02%20few%20short%20prompting.md)**: Pattern-matching and formatting rules.
* **[COT.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/prompting-notes/COT.md)**: Logic steps and intermediate thought pipelines.
* **[04 role play prompting.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/prompting-notes/04%20role%20play%20prompting.md)**: Identity and domain constraints in system prompts.
* **[llm-chat-roles.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/llm-chat-roles.md)**: System, User, Assistant, and Tool role configurations.
* **[model-specific-formats.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/model-specific-formats.md)**: Serialization templates (ChatML, Alpaca, Llama `[INST]`, FLAN-T5).
* **[llm-security-and-guardrails.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/llm-security-and-guardrails.md)**: Mitigating prompt injections and model distillation attacks.
* **[agent-architecture-and-loops.md](file:///home/aminul/development/gen-ai-cohort/week01/learning/day02/notes/agent-architecture-and-loops.md)**: Custom Loop Engineering and Harness Engineering.

## 🚀 Execution Instructions
Running interactive files requires setting appropriate credentials in the root **[.env](file:///home/aminul/development/gen-ai-cohort/.env)**.
```bash
# E.g. to query the backend engineer persona (Amie):
node --env-file=.env week01/learning/day02/persona/amie.js "How do I speed up SQL queries?"
```
