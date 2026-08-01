# Structured Output and Function Calling

This note covers how to extract predictable data from LLMs using structured output formats, Zod schemas, function calling, orchestration layers, and the concepts of AI Slop and Model Collapse.

---

## 1. Structured Output

LLMs natively output unstructured text. In software applications, developers need predictable data structures (like JSON objects matching strict schemas) to pass to frontends or database systems.

Instead of writing complex prompts hoping the model outputs JSON, modern APIs support **Structured Outputs** directly. Under the hood, the API engine forces the model to choose tokens that conform to the target JSON schema grammar, ensuring $100\%$ valid format compilation.

---

## 2. Schema Validation with Zod

**Zod** is a TypeScript-first schema declaration and validation library. It is used with LLM SDKs to define the expected structure, perform runtime validation, and auto-generate typescript interfaces.

Example schema declaration:
```typescript
import { z } from "zod";

const RiskSchema = z.object({
  title: z.string().describe("Concise name of the risk"),
  score: z.number().min(1).max(5).describe("Severity rating out of 5"),
  mitigation: z.string().optional()
});
```

---

## 3. Function Calling (Tool Use)

**Function Calling** is a workflow where developers define local application functions (e.g. `send_email`, `query_database`) and present them to the LLM as capabilities.

### Standard Loop:
1. **Request:** The user asks a question requiring external data (e.g., "What is the status of invoice #102?").
2. **Analysis:** The LLM decides it needs tool assistance and returns a structured payload detailing the function name and arguments (`query_db({ invoice_id: 102 })`).
3. **Execution:** The application intercepts this response, runs the actual query_db function on the database, and gets the real status.
4. **Resubmit:** The application sends the database output back to the LLM.
5. **Answer:** The LLM processes the facts and responds to the user in clean text.

---

## 4. LangChain

**LangChain** is an open-source orchestration library designed to simplify prompt templating, multi-step chains, tool-calling agent loops, memory management, and retrieval pipelines (RAG). It provides standard wrappers for dozens of model providers and vector stores.

---

## 5. AI Slop & Model Collapse

As generative AI is deployed widely, we face systemic data quality challenges:

* **AI Slop:** The proliferation of low-quality, generic, unverified AI-generated text, images, and content across the public internet.
* **Model Collapse:** An architectural risk where future generations of frontier AI models are trained on datasets containing massive amounts of AI-generated content (rather than human-produced datasets). Over generations, this feedback loop degrades the model's accuracy, diversity, and reasoning capabilities, leading to systemic errors and hallucinations.

### Mitigation Strategies:
- Incorporate Human-in-the-loop review.
- Source curated, verified gold-standard human datasets for training/fine-tuning.
- Implement strict input/output filter guardrails.
