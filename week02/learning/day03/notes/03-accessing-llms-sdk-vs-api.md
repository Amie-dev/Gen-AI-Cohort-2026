# Accessing LLMs: APIs, SDKs, and Local Models

This note covers the different methods developers use to integrate LLMs, from raw HTTP interfaces to advanced Agent SDKs and local offline model environments.

---

## 1. REST API vs SDK vs Agent SDK

| Integration Level | Description | Pro / Con |
| :--- | :--- | :--- |
| **REST API** (Raw HTTP) | Making raw requests to `/chat/completions` using tools like `fetch`, `axios`, or `curl`. | **Pro:** Complete control, works in any language. <br>**Con:** Requires manual JSON formatting, authorization headers, error retries, and parsing. |
| **Standard SDK** | Official packages (e.g., `npm i openai`) wrapping HTTP calls. | **Pro:** Automatic headers, type safety, JSON parsing, helper classes. <br>**Con:** Restricted to standard request/response cycles. |
| **Agent SDK** | High-level orchestration layers (e.g., LangChain, LangGraph). | **Pro:** State machines, loops, built-in tool execution patterns, vector store integrations. <br>**Con:** Higher learning curve, abstract structure. |

---

## 2. Comparison Grid

| Feature | REST API | SDK | Agent SDK |
| :--- | :--- | :--- | :--- |
| **HTTP Handling** | ✅ Manual | ❌ Automatic | ❌ Automatic |
| **JSON Parsing** | Manual | Automatic | Automatic |
| **Authentication** | Manual | Automatic | Automatic |
| **Tool Calling** | Manual | Limited / Manual | Built-in |
| **Guardrails** | Manual | Manual | Built-in support |
| **Memory** | Manual | Manual | Built-in patterns |
| **Multi-Step Workflows** | Manual | Manual | Designed for it |

---

## 3. Popular AI SDKs

### OpenAI SDK
- Supports Chat Completions, Assistant APIs, Embeddings, Image/Audio processing.
- Features **Structured Outputs** (via Zod schemas and JSON schemas).

### Anthropic Claude SDK
- Known for large context sizes and high reasoning capability.
- Supports **Extended Thinking** (outputting `<thinking>` blocks) and **Tool Use**.

### Google Gemini SDK
- Uses the new `@google/genai` library (replacing the legacy `@google/generative-ai` package).
- Features native multi-modality (accepting text, images, video, and audio directly in a single prompt block) and extremely large context windows.

### Mistral SDK
- Access to Mistral's open and commercial models (e.g., `mistral-large`, `codestral`).
- Supports streaming and function calling.

### Groq SDK
- Specialized ultra-fast LPU (Language Processing Unit) inference for open models (like Llama 3, Mixtral).
- Fully compatible with OpenAI API structure under the hood.

---

## 4. Local Models with Ollama

**Ollama** is an open-source framework that bundles LLM weights and runners, enabling developers to run state-of-the-art models locally on their own hardware.

### Key Benefits:
- **Zero cost:** No API token fees.
- **Privacy:** Data never leaves the local machine.
- **Offline development:** Build and test without internet connectivity.
- **Simple interface:** Start models with a single command.

### Getting Started:
To download and run Llama 3:
```bash
ollama run llama3
```

Supported models list includes `llama3`, `gemma`, `mistral`, `deepseek-coder`, `qwen`, and `phi3`.
