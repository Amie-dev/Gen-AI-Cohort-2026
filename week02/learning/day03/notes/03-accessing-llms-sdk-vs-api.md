# 📘 Accessing LLMs: APIs, SDKs & Local Models (JavaScript + AI Engineering Notes)

> **Purpose:** Learn the different ways to interact with Large Language Models (LLMs), understand when to use REST APIs, SDKs, Agent SDKs, and Local Models, and learn how production AI applications are built.

---

# 📚 Table of Contents

1. What Does "Accessing an LLM" Mean?
2. Architecture Overview
3. REST API
4. SDK
5. Agent SDK
6. REST vs SDK vs Agent SDK
7. Popular AI SDKs
8. OpenAI SDK (JavaScript)
9. Anthropic SDK
10. Google Gemini SDK
11. Mistral SDK
12. Groq SDK
13. Local Models (Ollama)
14. REST vs Local Models
15. Which Option Should You Choose?
16. Production Architecture
17. Best Practices
18. Interview Questions

---

# 1. What Does "Accessing an LLM" Mean?

## Definition

An **LLM (Large Language Model)** cannot directly run inside your JavaScript application.

Instead, your application **communicates** with the model using one of several methods.

Think of it like calling a friend.

Instead of shouting across the world, you:

* Call them
* Send a message
* Use an app

Similarly, your application communicates with an AI model through:

* REST API
* SDK
* Agent SDK
* Local Runtime

---

## Simple Architecture

```text
Your JavaScript App
        │
        ▼
   Communication Layer
        │
        ▼
   AI Model (GPT, Gemini, Claude, Llama)
```

The communication layer is what changes.

---

# 2. Different Ways to Access an LLM

There are **four common approaches**.

```text
                JavaScript App
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
   REST API          SDK         Agent SDK
                                      │
                                      ▼
                                   AI Agent
```

Or run a model locally:

```text
Your Computer

↓

Ollama

↓

Llama 3

↓

No Internet Needed
```

---

# 3. REST API

## Purpose

REST APIs provide the **lowest-level** way to communicate with an LLM.

Your application manually sends an HTTP request.

Example:

```text
JavaScript

↓

HTTP POST

↓

AI Server

↓

JSON Response
```

Everything is manual.

---

## How REST APIs Work

```text
Application

↓

POST Request

↓

Headers

↓

Authentication

↓

JSON Body

↓

LLM

↓

JSON Response
```

---

## JavaScript Example (fetch)

```js
const response = await fetch(
  "https://api.openai.com/v1/responses",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: "Explain JavaScript promises."
    })
  }
);

const data = await response.json();

console.log(data);
```

---

## Using Axios

```bash
npm install axios
```

```js
import axios from "axios";

const response = await axios.post(
  "https://api.openai.com/v1/responses",
  {
    model: "gpt-5",
    input: "Hello"
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  }
);

console.log(response.data);
```

---

## Pros

* Works in every language
* Complete control
* Easy to debug
* No extra libraries required

---

## Cons

* More code
* Manual authentication
* Manual error handling
* Manual JSON parsing
* Manual retries

---

# 4. SDK (Software Development Kit)

## Purpose

An SDK wraps the REST API in easy-to-use functions.

Instead of writing HTTP requests manually,

you call JavaScript methods.

---

## Architecture

```text
JavaScript

↓

OpenAI SDK

↓

HTTP Request

↓

LLM

↓

SDK

↓

JavaScript
```

The SDK hides the networking details.

---

## Install

```bash
npm install openai
```

---

## JavaScript Example

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await client.responses.create({
  model: "gpt-5",
  input: "Explain async/await."
});

console.log(response.output_text);
```

Notice:

No `fetch()`

No headers

No JSON parsing

The SDK does it automatically.

---

## Advantages

* Cleaner code
* Type safety (TypeScript)
* Automatic authentication
* Streaming support
* Structured output support
* Better developer experience

---

# 5. Agent SDK

## Purpose

Agent SDKs help build **AI Agents**, not just chatbots.

They provide:

* Tool Calling
* Memory
* Multi-step reasoning
* Workflows
* Agents
* Retrieval (RAG)
* Vector Databases

Examples include orchestration frameworks that manage complex AI workflows.

---

## Architecture

```text
User

↓

Agent SDK

↓

Memory

↓

Tools

↓

Vector DB

↓

LLM

↓

Answer
```

---

## Example Flow

```text
User

↓

Need Weather?

↓

Weather Tool

↓

Need Database?

↓

Database

↓

Need Calculator?

↓

Calculator

↓

LLM

↓

Answer
```

The framework coordinates the workflow.

---

# 6. REST vs SDK vs Agent SDK

| Feature           | REST API                      | SDK          | Agent SDK               |
| ----------------- | ----------------------------- | ------------ | ----------------------- |
| HTTP Requests     | Manual                        | Automatic    | Automatic               |
| Authentication    | Manual                        | Automatic    | Automatic               |
| JSON Parsing      | Manual                        | Automatic    | Automatic               |
| Streaming         | Manual                        | Built-in     | Built-in                |
| Tool Calling      | Manual                        | Supported    | Built-in workflows      |
| Memory            | Manual                        | Manual       | Built-in patterns       |
| Multi-Step Agents | Manual                        | Manual       | Designed for it         |
| Best For          | Learning, custom integrations | Most AI apps | AI Agents & RAG systems |

---

# 7. Popular AI SDKs

## OpenAI SDK

Purpose:

Access OpenAI models.

Supports:

* Chat/Responses API
* Structured Outputs
* Function Calling
* Images
* Audio
* Embeddings
* Streaming

---

### Install

```bash
npm install openai
```

Example

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

---

## Anthropic SDK

Purpose:

Access Claude models.

Known for:

* Strong reasoning
* Long context windows
* Tool use
* Extended reasoning capabilities (where supported)

---

### Install

```bash
npm install @anthropic-ai/sdk
```

Example

```js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

---

## Google Gemini SDK

Purpose:

Access Gemini models.

Features:

* Text
* Images
* Audio
* Video
* Large context windows
* Native multimodal input

---

### Install

```bash
npm install @google/genai
```

Example

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
```

---

## Mistral SDK

Purpose:

Access Mistral models.

Supports:

* Chat
* Function Calling
* Streaming
* Open-weight and commercial models

---

### Install

```bash
npm install @mistralai/mistralai
```

Example

```js
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});
```

---

## Groq SDK

Purpose:

Run open models with very fast inference.

Common models:

* Llama
* Mixtral
* Gemma

---

### Install

```bash
npm install groq-sdk
```

Example

```js
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
```

---

# 8. Local Models (Ollama)

## What is Ollama?

**Ollama** lets you run LLMs directly on your own computer.

Instead of sending data to a cloud provider, the model runs locally.

---

## Architecture

```text
JavaScript App

↓

Ollama

↓

Llama 3

↓

Response
```

No internet connection is required after the model is installed.

---

## Why Use Ollama?

* No API costs
* Better privacy
* Offline development
* Fast local testing
* Full control over your environment

---

## Install Ollama

Download Ollama for your operating system from the official website.

---

## Run a Model

```bash
ollama run llama3
```

Ollama downloads the model (if needed) and starts an interactive chat.

---

## Other Popular Models

```bash
ollama run mistral
```

```bash
ollama run qwen
```

```bash
ollama run gemma
```

```bash
ollama run phi3
```

```bash
ollama run deepseek-coder
```

---

## Using Ollama from JavaScript

Ollama exposes a local HTTP API.

```js
const response = await fetch(
  "http://localhost:11434/api/generate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3",
      prompt: "Explain closures."
    })
  }
);

const data = await response.json();

console.log(data.response);
```

---

# 9. Cloud Models vs Local Models

| Feature                | Cloud APIs            | Local Models                                |
| ---------------------- | --------------------- | ------------------------------------------- |
| Internet Required      | ✅ Yes                | ❌ No (after installation)                  |
| API Cost               | Usually yes           | No per-request API fees                     |
| Privacy                | Data sent to provider | Data stays on your machine                  |
| Setup                  | Simple                | Requires model download and local resources |
| Latest Frontier Models | Yes                   | Depends on available open models            |
| Hardware Requirements  | Low                   | Depends on model size                       |

---

# 10. Which Option Should You Choose?

| Scenario                       | Recommended Approach                   |
| ------------------------------ | -------------------------------------- |
| Learning HTTP                  | REST API                               |
| Building a chatbot             | Official SDK                           |
| Building AI agents             | Agent SDK                              |
| Offline development            | Ollama                                 |
| Privacy-sensitive applications | Local Models                           |
| Production AI applications     | Official SDK + orchestration framework |

---

# 11. Production Architecture

```text
                User
                  │
                  ▼
           Frontend (React)
                  │
                  ▼
       Node.js / Express Backend
                  │
                  ▼
        Authentication & Validation
                  │
                  ▼
          AI Service Layer
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     Official SDK      Local Model
          │                 │
          ▼                 ▼
     Cloud Provider      Ollama
          │
          ▼
       AI Response
```

Separating AI logic into its own service layer makes it easier to swap providers, add logging, implement retries, and manage secrets.

---

# 12. Best Practices

* Store API keys in environment variables (never hard-code them).
* Use the official SDK for most production applications.
* Add retry logic for temporary API failures.
* Validate AI outputs before using them.
* Stream long responses to improve user experience.
* Monitor token usage and API costs.
* Use local models when privacy or offline access is important.
* Keep your AI provider behind a backend service instead of exposing API keys in frontend applications.

---

# 13. Common Mistakes

❌ Hard-coding API keys in source code.

❌ Calling AI APIs directly from a public frontend with secret credentials.

❌ Ignoring rate limits and retry strategies.

❌ Assuming local models perform exactly like large cloud-hosted frontier models.

❌ Skipping output validation when integrating AI into business workflows.

---

# 14. Interview Questions

### What is a REST API?

A REST API is a standard HTTP interface that allows applications to communicate with an AI service by sending requests and receiving responses.

---

### Why use an SDK instead of raw HTTP?

An SDK simplifies development by handling authentication, request formatting, response parsing, and other common tasks automatically.

---

### What is an Agent SDK?

An Agent SDK helps build AI agents by providing patterns for tool calling, memory, workflow orchestration, and multi-step reasoning.

---

### What is Ollama?

Ollama is a framework for running open-source LLMs locally, allowing offline, private, and cost-effective AI development.

---

### When should you use local models?

When you need privacy, offline capability, reduced recurring API costs, or full control over the inference environment.

---

# 📌 Quick Summary

| Concept           | Purpose                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| REST API          | Direct HTTP communication with an AI service                                 |
| SDK               | Simplifies API access with helper methods and automatic handling             |
| Agent SDK         | Builds AI agents with tools, memory, and workflows                           |
| OpenAI SDK        | Access OpenAI models and AI features                                         |
| Anthropic SDK     | Access Claude models                                                         |
| Google Gemini SDK | Access Gemini multimodal models                                              |
| Mistral SDK       | Access Mistral open-weight and commercial models                             |
| Groq SDK          | Fast inference for supported open models                                     |
| Ollama            | Run LLMs locally on your own machine                                         |
| Local Models      | Improve privacy, enable offline development, and avoid per-request API costs |
