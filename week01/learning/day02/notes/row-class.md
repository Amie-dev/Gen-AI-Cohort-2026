# Day 02: Prompt Engineering & Agent Foundations

Welcome to the detailed study guide and notes for **Day 02 of Week 01** of the **Gen AI JS Cohort 2026**. Today, we focus on moving from raw model queries to structured prompting methodologies, prompt-level security, chat role configurations, and the conceptual foundations of LLM Agents and loop engineering.

---

## 📖 Table of Contents
1. **Core Prompting Techniques**
   * [Zero-Shot Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/01%20zero%20short%20prompting.md)
   * [Few-Shot Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/02%20few%20short%20prompting.md)
   * [Chain of Thought (CoT) Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/COT.md)
   * [Role-Play / Persona Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/04%20role%20play%20prompting.md)
2. **[LLM API Chat Roles](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/llm-chat-roles.md)**
3. **[Model-Specific Prompt Formatting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/model-specific-formats.md)**
4. **[LLM Security & Alignment Concepts](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/llm-security-and-guardrails.md)**
5. **[Agent Architecture & Loop Engineering](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/agent-architecture-and-loops.md)**
6. **[Day 02 Practical Assignments](#6-day-02-practical-assignments)**

---

## 1. Core Prompting Techniques

Prompt engineering is the process of structuring an input to an LLM so that its output is maximally useful, accurate, and aligned with requirements.

### [Zero-Shot Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/01%20zero%20short%20prompting.md)
* **Definition**: Querying the LLM directly with an instruction or question without providing any examples of the expected input-output format.
* **Mechanism**: Relies entirely on the LLM's pre-trained knowledge base and reasoning capabilities.
* **Best Used For**: Straightforward questions, creative writing, summarization, and translation.

### [Few-Shot Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/02%20few%20short%20prompting.md)
* **Definition**: Providing one or more input-output examples (exemplars) within the prompt to guide the LLM's response structure, tone, or format.
* **Mechanism**: Demonstrates the pattern to the model using in-context learning.
* **Best Used For**: Enforcing strict output formats, classification tasks, syntactic structures, and when zero-shot fails to match your exact output schema.

### [Chain of Thought (CoT) Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/COT.md)
* **Definition**: Instructing the model to break down a problem step-by-step and show its intermediate reasoning process before producing the final answer.
* **Mechanism**: Allows the model to allocate more computing budget (tokens) to reasoning, preventing it from jumping to incorrect intuitive conclusions.
* **CoT Pipeline Design**: Today, we structured a pipeline using a state-like reasoning pattern:
  `INITIAL` ──> `THINK` ──> `ANALYZE` ──> `OUTPUT`

### [Role-Play / Persona Prompting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/prompting-notes/04%20role%20play%20prompting.md)
* **Definition**: Giving the AI a specific background, professional identity, rules, and personality traits (a "persona").
* **Mechanism**: Projects the LLM's response generation vectors into a specific subset of its training data (e.g., matching the writing style of a senior software engineer).

---

## 2. [LLM API Chat Roles](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/llm-chat-roles.md)

Modern LLMs are queried using a chat interface, which breaks the prompt down into a structured array of messages. Each message is assigned a specific `role`:
* **`system`**: Sets global instructions, persona, limits, safety guidelines, and output constraints.
* **`user`**: Represents questions, commands, or data inputs supplied by the human operator.
* **`assistant`**: Represents the model's previous completions, maintaining conversation history.
* **`developer` / `tool`**: Provides the feedback or response from external system functions (API call results, CLI execution outputs).

---

## 3. [Model-Specific Prompt Formatting](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/model-specific-formats.md)

LLMs do not natively understand the structured arrays of JSON messages we pass to API clients. Under the hood, APIs serialize these message objects into a raw text stream using special formatting syntax that the base models were trained on.
* **ChatML (Chat Markup Language)**: uses `<|im_start|>role` and `<|im_end|>` tags.
* **Alpaca Format**: uses `### Instruction:`, `### Input:`, and `### Response:` blocks.
* **Llama 2/3 INST Format**: uses `[INST]` and `<<SYS>>` tags.
* **FLAN-T5 (Google)**: uses direct command prefixes.

---

## 4. [LLM Security & Alignment Concepts](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/llm-security-and-guardrails.md)

* **Prompt Injection**: Manipulating an LLM's behavior by inserting adversarial instructions into user inputs (Direct and Indirect).
* **Guardrails**: Programmatic validation layers placed before input processing (Input Guardrails) and after output generation (Output Guardrails).
* **Distillation & Extraction Attacks**: Querying a model to systematically extract its system prompt or replicate its functionality to train student models.
* **GIGO (Garbage In, Garbage Out)**: The quality of LLM output directly correlates to the clarity, context, and structural quality of your prompt.

---

## 5. [Agent Architecture & Loop Engineering](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/agent-architecture-and-loops.md)

* **What is an Agent?**: $\text{Agent} = \text{LLM (Reasoning Engine)} + \text{Loop/Planning Engine} + \text{Tools (Actions)}$
* **Loop Engineering**: State cycle of **Perceive** (getting inputs), **Decide** (choosing next step or tool call), and **Act** (running tools and feeding back the results).
* **Harness Engineering (The GPT-4 Era)**: The paradigm shift of building software architectures around LLMs using structured formatting, state bounds, infinite-loop protection, and self-healing logic.

---

## 6. Day 02 Practical Assignments

In your directory structures, you are tasked with implementing the following assignments:

### 📁 Assignment 1: Developer Personas
Under the **[persona/](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/persona/)** directory, we implemented two interactive developer personas:
1. **[amie.js](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/persona/amie.js)**: A senior backend engineer specializing in Node.js, database optimization, and scalable systems.
2. **[ria.js](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/persona/ria.js)**: A frontend UX/UI wizard specializing in animations, CSS layout structure, and state management.

### 📁 Assignment 2: Technical Support Advisor Persona
* **[tech_advisor.js](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/persona/tech_advisor.js)**: A Software Engineer persona that answers programming questions, formats responses cleanly, and automatically suggests relevant YouTube learning videos.

---
*End of Day 02 Notes.*