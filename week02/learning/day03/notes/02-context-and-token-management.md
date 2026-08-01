# 📘 Context & Token Management (JavaScript + AI Engineering Notes)

> **Purpose:** Learn how Large Language Models (LLMs) manage context, how tokens affect performance and cost, why hallucinations happen, and how production AI systems optimize prompts for speed, accuracy, and scalability.

---

# Table of Contents

1. What is Context?
2. What is a Context Window?
3. What are Tokens?
4. How Tokens are Counted
5. Context Window Architecture
6. Why Context Windows Matter
7. Problems with Large Context Windows
8. Context Management Strategies
9. Token Cost Optimization
10. Hallucinations
11. Inference vs Training
12. JavaScript Examples
13. Production Best Practices
14. Interview Questions

---

# 1. What is Context?

## Definition

**Context** is all the information an LLM receives before generating a response.

Think of context as the model's **working memory** for a single request.

The model doesn't "remember" previous conversations automatically—it only knows what is included in the current context.

---

## Example

User asks:

```text
My name is Aminul.

I am learning JavaScript.

Explain closures.
```

The model sees all of this together:

```text
Context

↓

My name is Aminul.

↓

I am learning JavaScript.

↓

Explain closures.
```

It can now answer:

```text
Hi Aminul,

Since you're learning JavaScript...
```

Without the earlier messages, it wouldn't know your name or learning level.

---

# 2. What is a Context Window?

## Definition

A **Context Window** is the maximum amount of text (measured in **tokens**) that an LLM can process in a single request.

It includes:

* System Prompt
* User Messages
* Conversation History
* Tool Results
* Assistant Responses

Everything counts toward the limit.

---

## Simple Diagram

```text
┌─────────────────────────────────────────────┐
│           Context Window (128K)             │
├─────────────────────────────────────────────┤
│ System Prompt                               │
│ Previous Messages                           │
│ Memory                                      │
│ Tool Results                                │
│ Current User Prompt                         │
│ Assistant Response                          │
└─────────────────────────────────────────────┘
```

If the total exceeds the limit, older content must be removed, summarized, or retrieved dynamically.

---

# 3. What are Tokens?

## Definition

LLMs do **not** read text word by word.

They read **tokens**.

A token is a small unit of text.

It may be:

* A word
* Part of a word
* A punctuation mark
* A number
* A space

---

## Example

Sentence:

```text
JavaScript is awesome!
```

Approximate tokenization:

```text
Java
Script
 is
 awesome
 !
```

Different models use different tokenizers, so token counts vary.

---

## Approximate Conversion

| Text        | Approximate Tokens |
| ----------- | -----------------: |
| 1 token     |      ~4 characters |
| 100 words   |        ~130 tokens |
| 1 page      |    ~500–700 tokens |
| 1,000 words |      ~1,300 tokens |

These are estimates, not exact values.

---

# 4. What Counts Toward Tokens?

Everything sent to the API.

Example:

```text
System Prompt

↓

You are a JavaScript teacher.
```

*

```text
Previous Chat
```

*

```text
Current User Message
```

*

```text
Weather Tool Output
```

*

```text
Assistant Response
```

All contribute to the total token usage.

---

## JavaScript Example

```js
const messages = [
  {
    role: "system",
    content: "You are a helpful JavaScript mentor."
  },
  {
    role: "user",
    content: "Explain promises."
  }
];
```

Both messages consume input tokens.

The model's reply consumes output tokens.

---

# 5. Context Window Sizes

Different models support different maximum context lengths.

| Model Generation    |       Typical Context Window |
| ------------------- | ---------------------------: |
| Older models        |                ~2K–8K tokens |
| Modern models       |            ~128K–200K tokens |
| Long-context models | 1M+ tokens (model-dependent) |

Larger context windows allow more information but also increase cost and processing time.

---

# 6. Context Window Architecture

```text
                     User
                       │
                       ▼
              Current Question
                       │
                       ▼
        ┌───────────────────────────┐
        │     Context Window        │
        ├───────────────────────────┤
        │ System Prompt             │
        │ Conversation History      │
        │ Memory                    │
        │ Retrieved Documents       │
        │ Tool Results              │
        │ User Prompt               │
        └───────────────────────────┘
                       │
                       ▼
                     LLM
                       │
                       ▼
                  Final Answer
```

---

# 7. Why Context Windows Matter

Without enough context:

```text
User:
My favorite language is JavaScript.

...

Later:

What's my favorite language?

↓

LLM:

I don't know.
```

With the earlier message included:

```text
JavaScript
```

Context enables continuity and personalization.

---

# 8. Problems with Large Context Windows

A large context window does **not** mean you should always fill it.

## 1. Higher Cost

More input tokens = higher API cost.

Example:

```text
100 Tokens

↓

Cheap
```

```text
100,000 Tokens

↓

Much More Expensive
```

---

## 2. Slower Responses

The model must process every token before generating an answer.

More tokens = more computation = higher latency.

---

## 3. Lost in the Middle

The model may miss important information buried in the middle of a very long prompt.

Example:

```text
Start

↓

50,000 Lines

↓

Important Line

↓

50,000 More Lines

↓

End
```

The critical detail is easier to overlook.

---

## 4. More Hallucinations

Mixing relevant and irrelevant information increases the chance of incorrect or fabricated responses.

---

# 9. Context Management Strategies

## A. Sliding Window

Keep only the most recent messages.

Example:

```text
Message 1 ❌

Message 2 ❌

Message 3 ❌

Message 18 ✅

Message 19 ✅

Message 20 ✅
```

### JavaScript Example

```js
const MAX_MESSAGES = 10;

messages = messages.slice(-MAX_MESSAGES);
```

---

## B. Conversation Summarization

Replace old messages with a concise summary.

Before:

```text
120 messages
```

After:

```text
Summary:

The user is learning JavaScript,
built a React app,
and prefers short examples.
```

This preserves important information while reducing token usage.

---

## C. Retrieval-Augmented Generation (RAG)

Instead of sending an entire knowledge base, retrieve only relevant documents.

Without RAG:

```text
Entire Documentation

↓

1,000 Pages

↓

LLM
```

With RAG:

```text
Search

↓

Relevant Sections

↓

LLM
```

### JavaScript Example (Concept)

```js
const docs = await vectorDB.search(userQuestion);

const prompt = `
Context:
${docs}

Question:
${userQuestion}
`;
```

---

## D. Semantic Filtering

Remove:

* Duplicate information
* Empty messages
* Irrelevant context
* Formatting noise

Only keep information relevant to the current task.

---

# 10. Token Cost Structure

Most AI providers charge separately for:

* Input Tokens
* Output Tokens

Formula:

```text
Total Cost =
(Input Tokens × Input Price)
+
(Output Tokens × Output Price)
```

Output tokens are often more expensive because generating each token requires repeated computation during inference.

---

## Example

Input:

```text
2,000 Tokens
```

Output:

```text
500 Tokens
```

Total cost depends on the model's pricing for both categories.

---

# 11. Cost Optimization Techniques

## Keep System Prompts Short

❌

```text
Very long instructions repeated every request...
```

✅

```text
Clear, concise instructions.
```

---

## Use Summaries

Replace 100 old messages with a short summary.

---

## Use RAG

Retrieve only relevant knowledge instead of sending everything.

---

## Limit Output Length

Example:

```js
const MAX_TOKENS = 300;
```

Shorter outputs reduce latency and cost.

---

## Avoid Duplicate Context

Don't send the same documentation repeatedly if it hasn't changed.

---

# 12. Hallucinations

## Definition

A **hallucination** occurs when an LLM generates information that is:

* Incorrect
* Fabricated
* Unsupported by evidence
* Presented confidently

---

## Example

User:

```text
Who invented JavaScript in 2015?
```

Incorrect response:

```text
John Smith invented JavaScript in 2015.
```

This is fabricated.

---

## Why Hallucinations Happen

* Missing knowledge
* Ambiguous prompts
* Weak context
* Conflicting information
* Long, noisy context
* Requests outside the model's knowledge

---

## Reduce Hallucinations

* Use RAG with trusted documents.
* Use tool calls for live information.
* Ask the model to cite retrieved evidence.
* Validate outputs against schemas.
* Clarify ambiguous user requests.
* Keep context focused and relevant.

---

# 13. Training vs Inference

## Training

The model learns from massive datasets.

```text
Books

↓

Articles

↓

Code

↓

Training

↓

Model
```

Training is computationally expensive and happens before deployment.

---

## Inference

Inference is when users interact with the trained model.

```text
User Prompt

↓

LLM

↓

Response
```

Every API request is an inference.

---

## Comparison

| Training                | Inference                 |
| ----------------------- | ------------------------- |
| Learns model parameters | Uses learned parameters   |
| Uses huge datasets      | Uses a user prompt        |
| Very expensive          | Relatively lightweight    |
| Done occasionally       | Happens for every request |

---

# 14. JavaScript Example

```js
async function askAI(userQuestion) {
  // Keep only the last 10 messages
  messages = messages.slice(-10);

  // Retrieve relevant documentation
  const docs = await vectorDB.search(userQuestion);

  const prompt = `
Context:
${docs}

Question:
${userQuestion}
`;

  const response = await callLLM(prompt);

  return response;
}
```

This example combines:

* Sliding Window
* RAG
* Prompt construction

to keep context relevant and efficient.

---

# 15. Production Best Practices

* Keep prompts concise and task-focused.
* Use RAG instead of pasting large documents.
* Summarize long conversations.
* Monitor token usage and API costs.
* Cache repeated prompts where appropriate.
* Validate retrieved documents before use.
* Remove irrelevant or duplicate context.
* Set sensible output token limits.
* Measure latency as context grows.

---

# 16. Common Mistakes

❌ Sending entire PDFs when only one paragraph is needed.

❌ Keeping every chat message forever in the active context.

❌ Repeating the same system prompt multiple times.

❌ Ignoring token costs in high-traffic applications.

❌ Assuming a larger context window always improves answer quality.

---

# 17. Interview Questions

### What is a Context Window?

The maximum number of tokens an LLM can process in a single request, including prompts, conversation history, tool outputs, and generated responses.

---

### What is a Token?

A token is a small unit of text processed by the model, such as a word, part of a word, punctuation, or symbols.

---

### Why is Context Management Important?

It reduces cost and latency, improves response quality, and prevents the model from being overwhelmed by irrelevant information.

---

### What is the "Lost in the Middle" Problem?

It's a phenomenon where important information placed in the middle of a long context is more likely to be overlooked by the model.

---

### What is Hallucination?

A hallucination is a response that contains fabricated or incorrect information presented as if it were true.

---

### What is Inference?

Inference is the process of using a trained model to generate predictions or responses for new user inputs.

---

# 📌 Quick Summary

| Concept            | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| Context            | Information available to the model for a request                 |
| Context Window     | Maximum tokens the model can process                             |
| Tokens             | Units of text processed by the model                             |
| Sliding Window     | Keep only recent conversation history                            |
| Summarization      | Compress older conversations into a concise summary              |
| RAG                | Retrieve only relevant information instead of sending everything |
| Semantic Filtering | Remove duplicate or irrelevant context                           |
| Token Optimization | Reduce cost, latency, and prompt size                            |
| Hallucination      | Confident but incorrect or fabricated output                     |
| Training           | Learn model parameters from datasets                             |
| Inference          | Use the trained model to answer user prompts                     |
