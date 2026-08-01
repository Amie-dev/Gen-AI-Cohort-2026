# 📘 Structured Output & Function Calling (JavaScript Notes)

---

# 1. What is Structured Output?

Normally, LLMs return plain text.

Example:

```text
The user's name is Aminul and age is 22.
```

This is difficult for applications because we cannot reliably extract data.

Instead, we want predictable JSON.

```json
{
  "name": "Aminul",
  "age": 22
}
```

This is called **Structured Output**.

Applications can easily:

* Save into Database
* Send to Frontend
* Validate Data
* Call APIs
* Build Automations

---

# Why Structured Output?

Without structured output:

```js
const response = `
Name: Aminul
Age: 22
`;
```

Need regex parsing 😢

```js
const name = response.match(/Name:\s(.+)/)[1];
```

Very unreliable.

Instead:

```json
{
  "name": "Aminul",
  "age": 22
}
```

Simply:

```js
const user = JSON.parse(response);

console.log(user.name);
```

Much easier.

---

# Real World Example

User asks:

> Find risks in this project.

Normal Response

```text
Risk 1:
Server overload

Risk 2:
Security issues
```

Structured Output

```json
{
  "risks": [
    {
      "title": "Server Overload",
      "score": 5
    },
    {
      "title": "Security Issues",
      "score": 4
    }
  ]
}
```

Now frontend can directly display it.

---

# How APIs Generate Structured Output?

Modern APIs don't just "hope" the model returns JSON.

Instead they enforce a **JSON Schema**.

The model is only allowed to generate tokens that follow the schema.

Think like this:

```
Allowed:

{

"name":

"age":

}

Not Allowed:

Hello...

Maybe...

I think...
```

This guarantees valid JSON.

---

# Example using OpenAI (JavaScript)

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.responses.create({
  model: "gpt-5",
  input: "Extract user information.",
});

console.log(response.output_text);
```

---

# 2. Zod Schema Validation

## What is Zod?

Zod is a JavaScript/TypeScript library for validating data.

Imagine a security guard.

```
Incoming JSON

↓

Zod

↓

Valid Data ✔

or

Error ❌
```

Install

```bash
npm install zod
```

---

## Simple Schema

```js
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});
```

Expected JSON

```json
{
  "name": "Aminul",
  "age": 22
}
```

---

## Validation

```js
const user = {
  name: "Aminul",
  age: 22,
};

const result = UserSchema.safeParse(user);

console.log(result.success);
```

Output

```text
true
```

---

Wrong Data

```js
const user = {
  name: "Aminul",
  age: "Twenty",
};
```

Output

```text
false
```

---

## Optional Fields

```js
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().optional(),
});
```

Valid

```json
{
  "name": "Aminul",
  "age": 22
}
```

Also Valid

```json
{
  "name": "Aminul",
  "age": 22,
  "email": "abc@gmail.com"
}
```

---

## Enum

```js
const UserSchema = z.object({
  role: z.enum([
    "admin",
    "user",
    "guest"
  ])
});
```

Only these values are accepted.

---

## Array

```js
const UserSchema = z.object({
  skills: z.array(z.string())
});
```

Example

```json
{
  "skills": [
    "React",
    "Node",
    "Next.js"
  ]
}
```

---

## Nested Objects

```js
const UserSchema = z.object({
  name: z.string(),

  address: z.object({
    city: z.string(),
    country: z.string(),
  }),
});
```

---

## Risk Schema

```js
import { z } from "zod";

const RiskSchema = z.object({
  title: z
    .string()
    .describe("Risk name"),

  score: z
    .number()
    .min(1)
    .max(5),

  mitigation: z
    .string()
    .optional(),
});
```

Example Output

```json
{
  "title": "Server Crash",
  "score": 5,
  "mitigation": "Use Load Balancer"
}
```

---

# Why Zod with AI?

AI sometimes returns:

```json
{
  "score": "High"
}
```

But your app expects:

```json
{
  "score": 5
}
```

Zod catches invalid responses before they reach your application.

---

# 3. Function Calling (Tool Calling)

LLMs cannot:

* Access your database
* Send emails
* Read local files
* Check weather
* Make payments

Instead they ask your application to perform these tasks.

```
User

↓

LLM

↓

Tool Request

↓

Your Backend

↓

Real Data

↓

LLM

↓

User
```

---

## Example

User

```
What's invoice 102 status?
```

LLM

```
Need database.
```

Tool Request

```json
{
  "tool": "queryInvoice",
  "arguments": {
    "invoiceId": 102
  }
}
```

Backend

```js
function queryInvoice(invoiceId) {
  return {
    status: "Paid",
    amount: 1200,
  };
}
```

Application executes

```js
const data = queryInvoice(102);
```

Returns

```json
{
  "status": "Paid",
  "amount": 1200
}
```

LLM

```
Invoice #102 has already been paid.
```

---

# Another Example

Tool

```js
function sendEmail(to, subject, body) {
  console.log("Sending Email...");
}
```

User

```
Email Rahul about tomorrow's meeting.
```

LLM

```json
{
  "tool": "sendEmail",
  "arguments": {
    "to": "rahul@gmail.com",
    "subject": "Meeting",
    "body": "See you tomorrow."
  }
}
```

Backend

```js
sendEmail(
  "rahul@gmail.com",
  "Meeting",
  "See you tomorrow."
);
```

---

# Simple Tool Flow

```
User

↓

LLM

↓

Need Tool?

↓

YES

↓

Return Function Name

↓

Backend Executes

↓

Tool Result

↓

LLM

↓

Final Answer
```

---

# Benefits

* Real-time Data
* Database Access
* API Calls
* Automation
* External Services
* Better Accuracy

---

# 4. LangChain

LangChain is an orchestration framework for building AI applications.

Instead of manually writing every step, LangChain connects everything together.

```
User

↓

Prompt

↓

LLM

↓

Tools

↓

Memory

↓

RAG

↓

Output
```

---

## Install

```bash
npm install langchain
```

---

## What LangChain Can Do

✅ Prompt Templates

```js
const prompt = `
Explain ${topic}
`;
```

---

✅ Memory

Remember previous conversations.

```
User:
My name is Aminul.

Later...

Who am I?

↓

Aminul
```

---

✅ Tool Calling

Connect

* Weather API
* Database
* Email
* Calculator

---

✅ Agents

Agent decides

```
Should I search?

↓

Need calculator?

↓

Need database?

↓

Need weather?
```

---

## RAG Pipeline

```
User

↓

Embedding

↓

Vector Database

↓

Retrieve Documents

↓

LLM

↓

Answer
```

LangChain makes building this flow easier.

---

# LangChain vs Without LangChain

Without

```js
Prompt

↓

LLM

↓

Tool

↓

Database

↓

LLM
```

You manage everything yourself.

With LangChain

```text
One framework manages:

✔ Prompt
✔ Memory
✔ Tool Calls
✔ RAG
✔ Chains
✔ Agents
```

---

# 5. AI Slop

AI Slop means huge amounts of low-quality AI-generated content flooding the internet.

Examples:

* Fake blogs
* Spam articles
* Clickbait
* AI-generated comments
* Low-quality tutorials
* AI-generated product reviews

Example

```
Top 10 JavaScript Tips

↓

Mostly copied AI content

↓

No verification
```

Problems

* Misinformation
* Duplicate content
* Poor search results
* Lower trust

---

# 6. Model Collapse

Future AI models learn from internet data.

If the internet becomes mostly AI-generated...

```
Human Data

↓

AI Model

↓

AI Content

↓

New AI Model

↓

Learns AI Content

↓

Produces Worse Content

↓

Repeat...
```

Eventually

* Less creativity
* More hallucinations
* Repeated mistakes
* Lower reasoning quality
* Reduced diversity

This is called **Model Collapse**.

---

# Example

Generation 1

```
Human → AI
```

Generation 2

```
AI learns from AI
```

Generation 3

```
AI learns from AI-generated AI
```

Quality keeps dropping.

---

# Mitigation Strategies

## Human Review

```
AI

↓

Human checks

↓

Publish
```

---

## Use High-Quality Human Data

Instead of random internet pages,

Use

* Books
* Research Papers
* Official Documentation
* Verified Educational Content
* Expert-written Articles

---

## Guardrails

Validate:

* Inputs
* Outputs
* Tool Usage
* Safety Rules

---

## Continuous Evaluation

Test AI regularly with benchmark datasets to detect hallucinations, formatting issues, and reasoning failures before deploying updates.

---

# Quick Interview Questions

### What is Structured Output?

A way to force an LLM to return data in a predefined format (such as JSON) that matches a schema, making it reliable for applications.

---

### Why use Zod?

* Runtime validation
* Type safety
* Clear schema definitions
* Prevents invalid AI responses from breaking your application

---

### What is Function Calling?

A mechanism where the LLM requests your application to execute predefined functions (tools) like querying a database, calling an API, or sending an email, then uses the results to generate the final response.

---

### What is LangChain?

An orchestration framework that helps build AI applications with prompt templates, memory, agents, tool calling, and RAG pipelines.

---

### What is AI Slop?

Large amounts of low-quality, repetitive, or unverified AI-generated content published on the internet.

---

### What is Model Collapse?

The gradual degradation of AI model quality when newer models are trained primarily on AI-generated content instead of high-quality human-created data.

---

# 📌 Summary

| Topic             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Structured Output | Return predictable JSON instead of free text                         |
| Zod               | Validate AI responses and enforce data schemas                       |
| Function Calling  | Let the model use external tools and APIs                            |
| LangChain         | Orchestrate prompts, tools, memory, and RAG workflows                |
| AI Slop           | Low-quality AI-generated content flooding the web                    |
| Model Collapse    | Quality degradation when AI repeatedly learns from AI-generated data |
