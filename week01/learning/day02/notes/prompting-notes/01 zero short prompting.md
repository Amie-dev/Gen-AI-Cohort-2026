# 📘 Zero-Shot Prompting — Detailed Notes

## 1. What is Zero-Shot Prompting?

**Zero-Shot Prompting** is a prompting technique where we ask an LLM to perform a task **without providing any examples** of how the task should be completed.

The model receives:

```text
Instruction → LLM → Response
```

For example:

```text
User:
Translate "I love programming" into Hindi.
```

There is **no example** such as:

```text
English: Good morning
Hindi: सुप्रभात
```

The model must understand the instruction using its existing knowledge.

### Simple Definition

> **Zero-shot prompting = Give the model a task directly, without examples.**

---

# 2. Zero-Shot Prompting Architecture

```text
                 ZERO-SHOT PROMPTING

        ┌─────────────────────────────┐
        │       User Instruction       │
        │                             │
        │ "Translate this into Hindi" │
        └──────────────┬──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │       LLM       │
              │                 │
              │ Pre-trained     │
              │ Knowledge       │
              │ + Instructions  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │     Output      │
              │                 │
              │ "इसे हिंदी में  │
              │  अनुवाद करें"   │
              └─────────────────┘
```

The important point is that **no demonstrations/examples are included in the prompt**.

---

# 3. How Does Zero-Shot Prompting Work?

An LLM has already learned patterns from large amounts of data during its **pre-training phase**.

When we provide an instruction, the model:

```text
Instruction
     ↓
Understand intent
     ↓
Use learned patterns
     ↓
Predict appropriate tokens
     ↓
Generate response
```

For example:

```text
Prompt:
"Summarize this article in 3 bullet points."

                 ↓

             LLM understands

                 ↓

        Summarization task

                 ↓

      Generates 3 bullet points
```

The model does not need us to explicitly teach it what "summarize" means every time.

---

# 4. Pre-Training and Zero-Shot Learning

The ability to perform many zero-shot tasks comes primarily from **pre-training**.

During pre-training, the model learns:

* Language patterns
* Grammar
* Facts and concepts
* Programming patterns
* Writing styles
* Relationships between words
* Common task structures

Conceptually:

```text
              PRE-TRAINING
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
     Books       Code       Websites
       │           │           │
       └───────────┼───────────┘
                   ▼
              LLM Weights
                   │
                   ▼
          Learned capabilities
                   │
                   ▼
             ZERO-SHOT TASK
                   │
                   ▼
                Output
```

So when we say:

> "Translate this sentence into French."

the model can perform the task without seeing a translation example in the current prompt.

---

# 5. Zero-Shot vs Traditional Programming

Traditional programming generally requires us to explicitly define the logic.

### Traditional approach

```javascript
function classify(text) {
  if (text.includes("good")) {
    return "positive";
  }

  if (text.includes("bad")) {
    return "negative";
  }

  return "neutral";
}
```

The developer defines the rules.

### Zero-shot LLM approach

```text
Classify the following review as positive,
negative, or neutral:

"The product quality is excellent."
```

The model uses its learned language understanding.

```text
Output:
Positive
```

---

# 6. Zero-Shot Prompt Structure

A good zero-shot prompt generally contains:

```text
┌───────────────────────┐
│       ROLE            │  Optional
├───────────────────────┤
│     INSTRUCTION       │  Required
├───────────────────────┤
│       CONTEXT         │  Optional
├───────────────────────┤
│       INPUT           │  Required
├───────────────────────┤
│    OUTPUT FORMAT      │  Optional
└───────────────────────┘
```

For example:

```text
You are a professional translator.

Translate the following sentence into Hindi.

Input:
"Artificial Intelligence is changing software development."

Output only the Hindi translation.
```

This is still **zero-shot** because there are no examples.

---

# 7. Basic Zero-Shot Example

### Prompt

```text
What is the capital of Japan?
```

### Output

```text
Tokyo.
```

There are no examples.

---

# 8. Zero-Shot Classification

Zero-shot prompting can be used for classification.

### Prompt

```text
Classify the following message as:
- Positive
- Negative
- Neutral

Message:
"The new update is amazing!"
```

### Output

```text
Positive
```

No classification examples were provided.

---

# 9. Zero-Shot Sentiment Analysis

Example:

```text
Analyze the sentiment of this review.

Review:
"The camera quality is excellent, but the battery life is disappointing."

Return one of:
Positive
Negative
Neutral
```

Possible output:

```text
Negative
```

Notice that the output can vary depending on the model and instruction because the review contains both positive and negative aspects.

For more reliable production classification, you may need clearer rules or examples.

---

# 10. Zero-Shot Summarization

You can directly ask an LLM to summarize text.

```text
Summarize the following text in 5 bullet points:

[ARTICLE]
```

Possible result:

```text
• AI adoption is increasing.
• Developers are using LLM APIs.
• RAG improves access to external knowledge.
• Agents can use tools.
• Security remains important.
```

Again, no examples are necessary.

---

# 11. Zero-Shot Translation

Example:

```text
Translate the following sentence into:

1. Hindi
2. Bengali
3. Japanese

Sentence:
"Technology changes the way we learn."
```

The model can generate all three translations without examples.

---

# 12. Zero-Shot Text Transformation

Zero-shot prompting is also useful for transforming one format into another.

### Markdown → HTML

```text
Convert this Markdown into HTML:

# Hello World

This is my first post.
```

Possible output:

```html
<h1>Hello World</h1>
<p>This is my first post.</p>
```

### Text → JSON

```text
Extract the following information as JSON:

Name: Aminul
Age: 21
Role: Developer
```

Possible output:

```json
{
  "name": "Aminul",
  "age": 21,
  "role": "Developer"
}
```

However, for production systems requiring **strict JSON**, structured-output features are usually more reliable than relying only on a prompt.

---

# 13. Zero-Shot Code Generation

You can ask the model to generate code directly.

```text
Write a JavaScript function that checks whether
a number is prime.
```

Possible response:

```javascript
function isPrime(n) {
  if (n < 2) return false;

  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }

  return true;
}
```

No example implementation was provided.

---

# 14. Zero-Shot Prompt with Constraints

Zero-shot does **not** mean that the prompt must be vague.

You can provide detailed instructions without providing examples.

For example:

```text
You are a technical writer.

Explain React Native to a beginner.

Requirements:
- Use simple English.
- Maximum 150 words.
- Use headings.
- Include one code example.
- Do not use emojis.
```

This is still zero-shot because there are **no input-output demonstrations**.

### Important distinction

```text
Detailed instructions ≠ Few-shot

Examples determine whether a prompt is few-shot.
```

---

# 15. Zero-Shot vs Few-Shot

This is one of the most important distinctions.

### Zero-Shot

```text
Classify the sentiment:

"I love this product."

Output:
```

No examples.

### Few-Shot

```text
Example 1:
"I love this product."
→ Positive

Example 2:
"This product is terrible."
→ Negative

Now classify:
"The product is okay."
```

Here, examples are provided.

Therefore:

```text
Zero-Shot  → No examples
Few-Shot   → One or more examples
```

---

# 16. Zero-Shot vs One-Shot

There are three common levels:

```text
Zero-Shot
    ↓
0 examples

One-Shot
    ↓
1 example

Few-Shot
    ↓
Multiple examples
```

Example:

### Zero-shot

```text
Classify:
"This is amazing."
```

### One-shot

```text
"This is terrible." → Negative

Classify:
"This is amazing."
```

### Few-shot

```text
"This is terrible." → Negative
"I love this." → Positive
"It is okay." → Neutral

Classify:
"This is amazing."
```

---

# 17. When Should You Use Zero-Shot Prompting?

Zero-shot is a good starting point when the task is:

### ✅ Simple

```text
What is JavaScript?
```

### ✅ Well-known

```text
Translate this sentence into Hindi.
```

### ✅ General-purpose

```text
Summarize this article.
```

### ✅ Creative

```text
Give me 10 startup ideas using AI.
```

### ✅ Straightforward classification

```text
Is this message positive or negative?
```

### ✅ Text transformation

```text
Convert this text into bullet points.
```

---

# 18. Advantages of Zero-Shot Prompting

## 1. Simple

You don't need to prepare examples.

```text
Instruction → Model → Output
```

---

## 2. Fast to Build

You can create a prototype quickly.

```javascript
const prompt = `
Summarize this article in 5 bullet points:

${article}
`;
```

---

## 3. Lower Token Usage

Few-shot prompts include additional examples.

Zero-shot can be smaller:

```text
Instruction + Input
```

instead of:

```text
Instruction + Example 1 + Example 2 + Example 3 + Input
```

This can reduce input-token usage.

---

## 4. Flexible

The same prompt structure can work with many different inputs.

```text
Summarize:
${text}
```

---

## 5. Good for Prototyping

When building an AI application, zero-shot is often a good first approach.

A practical workflow is:

```text
Start with Zero-Shot
        ↓
Evaluate results
        ↓
If insufficient
        ↓
Improve instructions
        ↓
Add examples if necessary
        ↓
Few-Shot
```

---

# 19. Limitations of Zero-Shot Prompting

## ❌ 1. Less Output Control

Suppose you ask:

```text
Give me the user's name and age.
```

The model might respond:

```text
Sure! The user's name is Aminul and he is 21 years old.
```

But your application might require:

```json
{
  "name": "Aminul",
  "age": 21
}
```

Prompt-only zero-shot instructions may not guarantee strict formatting.

For production applications, consider:

* Structured outputs
* JSON schema
* Function/tool calling
* Validation
* Retries

---

# 20. ❌ Complex Business Rules

Suppose your company has unusual classification rules:

```text
A customer is "VIP" if:

Purchase > ₹50,000
AND
Account age > 2 years
AND
Support tickets < 3
```

A zero-shot model might understand the instruction, but for important business logic, application code should enforce the rules.

```text
LLM
 ↓
Candidate decision
 ↓
Application validation
 ↓
Final decision
```

Never blindly trust an LLM for critical deterministic logic.

---

# 21. ❌ Ambiguous Instructions

Consider:

```text
Make this better.
```

What does "better" mean?

It could mean:

* Shorter
* More professional
* More persuasive
* More readable
* More technical

A better zero-shot prompt would be:

```text
Rewrite the following email.

Requirements:
- Professional tone
- Maximum 100 words
- Keep the original meaning
- Remove unnecessary sentences

Email:
...
```

### Lesson

> **The quality of a zero-shot result depends heavily on instruction clarity.**

---

# 22. ❌ Hallucination Risk

LLMs can generate information that sounds convincing but is incorrect.

For example:

```text
Who invented XYZ technology?
```

If the information is uncertain or unavailable, the model may still produce an answer.

For knowledge-sensitive applications:

```text
User
 ↓
Retriever / Database
 ↓
Relevant Context
 ↓
LLM
 ↓
Answer
```

This is one reason systems use **RAG (Retrieval-Augmented Generation)**.

---

# 23. ❌ Complex Reasoning

Some tasks are difficult to solve reliably using a single simple instruction.

For example:

```text
Analyze this large software architecture,
identify every security vulnerability,
calculate the impact,
and propose a complete remediation plan.
```

A simple zero-shot prompt may produce incomplete or inconsistent reasoning.

For complex tasks, you may use:

* Better task decomposition
* Tool calling
* Structured workflows
* Retrieval
* Verification
* Agent loops

---

# 24. Temperature and Zero-Shot Prompting

In your Gemini example:

```javascript
config: {
  temperature: 0.2
}
```

Temperature controls how much randomness is introduced into token selection.

Conceptually:

```text
Lower temperature
       ↓
More predictable output

Higher temperature
       ↓
More varied output
```

### Lower temperature

Useful for:

* Classification
* Extraction
* Translation
* Structured transformations

### Higher temperature

Can be useful for:

* Brainstorming
* Creative writing
* Idea generation

However, **temperature does not guarantee correctness or determinism**, and exact behavior depends on the model/API.

---

# 25. Gemini Zero-Shot Example

Using the Google Gen AI JavaScript SDK:

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const prompt = `
Translate this phrase into:
1. Spanish
2. German
3. Japanese

Phrase:
"Innovation distinguishes between a leader and a follower."

Return only the translations.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  console.log(response.text);
}

main();
```

### Flow

```text
JavaScript Application
        │
        ▼
   Prompt String
        │
        ▼
 Google Gen AI SDK
        │
        ▼
   Gemini Model
        │
        ▼
 Generated Response
        │
        ▼
 console.log()
```

---

# 26. Improving a Zero-Shot Prompt

### ❌ Weak Prompt

```text
Tell me about React Native.
```

The model has too much freedom.

### ✅ Better Prompt

```text
Explain React Native to a beginner.

Requirements:
- Explain what React Native is.
- Explain how it differs from React.
- Give 3 advantages.
- Give one simple example.
- Use simple English.
- Keep the response under 200 words.
```

Still zero-shot.

There are **no examples**, but the task is much more clearly defined.

---

# 27. Zero-Shot Prompting Best Practices

### 1. Clearly define the task

```text
Summarize the article.
```

instead of:

```text
Do something with this article.
```

---

### 2. Provide necessary context

```text
You are explaining this to a beginner developer.
```

---

### 3. Define constraints

```text
Maximum 150 words.
```

---

### 4. Define output format

```text
Return exactly 5 bullet points.
```

---

### 5. Separate instructions and data

A useful structure:

```text
INSTRUCTION:
Summarize the text.

REQUIREMENTS:
- 5 bullets
- Simple language

INPUT:
[Text]
```

---

### 6. Avoid ambiguous language

Instead of:

```text
Make this good.
```

Use:

```text
Rewrite this paragraph in a professional tone
while preserving its original meaning.
```

---

# 28. Zero-Shot Prompt Template

You can use this template:

```text
ROLE:
You are a [role].

TASK:
Perform [specific task].

CONTEXT:
[Relevant background information]

INPUT:
[User data]

REQUIREMENTS:
- Requirement 1
- Requirement 2
- Requirement 3

OUTPUT FORMAT:
[Expected format]
```

Example:

```text
ROLE:
You are a senior JavaScript developer.

TASK:
Review the following JavaScript function.

CONTEXT:
The function is used in a Node.js API.

INPUT:
[CODE]

REQUIREMENTS:
- Identify bugs.
- Explain performance issues.
- Suggest improvements.

OUTPUT FORMAT:
1. Problems
2. Explanation
3. Improved code
```

This is still **zero-shot**.

---

# 29. Zero-Shot in an AI Application

A simple AI application might look like:

```text
             User Input
                 │
                 ▼
        ┌────────────────┐
        │ Prompt Builder │
        └───────┬────────┘
                │
                ▼
        ┌────────────────┐
        │      LLM       │
        └───────┬────────┘
                │
                ▼
        ┌────────────────┐
        │ Output Parser  │
        └───────┬────────┘
                │
                ▼
          Application UI
```

For production:

```text
User Input
    ↓
Input Validation
    ↓
Prompt
    ↓
LLM
    ↓
Output Validation
    ↓
Retry / Repair if needed
    ↓
Application
```

---

# 30. Zero-Shot + Guardrails

Zero-shot prompting alone should not be considered a complete security mechanism.

For example:

```text
User Input
    ↓
Input Guardrail
    ↓
Zero-Shot Prompt
    ↓
LLM
    ↓
Output Guardrail
    ↓
Application
```

Guardrails can help enforce:

* Allowed topics
* Output format
* Safety policies
* Length limits
* Data validation
* Business constraints

---

# 31. Zero-Shot + Structured Output

A common production pattern is:

```text
Zero-Shot Instruction
        +
Structured Output Schema
        ↓
       LLM
        ↓
Validated Data
```

For example, instead of simply saying:

```text
Extract user information.
```

define a schema:

```json
{
  "name": "string",
  "email": "string",
  "age": "number"
}
```

The application can then validate the generated result.

---

# 32. Zero-Shot Decision Tree

```text
             Start
               │
               ▼
       Can the task be
       clearly described?
          /          \
        Yes           No
         │             │
         ▼             ▼
    Zero-Shot      Clarify task
         │
         ▼
    Test output
         │
         ▼
    Is quality good?
      /       \
    Yes        No
     │          │
     ▼          ▼
   Done    Improve prompt
                 │
                 ▼
          Still insufficient?
             /          \
           No            Yes
           │              │
           ▼              ▼
         Done         Few-Shot /
                     Workflow /
                     Tools / RAG
```

---

# 33. Real-World Examples

### Customer Support

```text
Classify this customer message:

"I cannot log into my account."

Categories:
- Billing
- Login
- Technical
- Other
```

### Developer Assistant

```text
Explain this JavaScript error
and provide a corrected version of the code.
```

### Content Creation

```text
Write a 60-second Instagram Reel script
about React Native navigation.
```

### Data Extraction

```text
Extract the product name, price, and category
from this description.
```

### Translation

```text
Translate this English text into Hindi.
```

All are zero-shot if **no demonstrations are included**.

---

# 34. Common Mistakes

### ❌ Mistake 1: Confusing detailed instructions with few-shot prompting

This:

```text
Use exactly 3 bullet points.
Use simple English.
Keep each bullet under 15 words.
```

is still zero-shot.

---

### ❌ Mistake 2: Assuming zero-shot means no constraints

You can have:

```text
Instruction
+ Context
+ Constraints
+ Output format
```

and still have zero-shot prompting.

---

### ❌ Mistake 3: Trusting the output blindly

LLM output should be validated when correctness matters.

```text
LLM output ≠ guaranteed truth
```

---

### ❌ Mistake 4: Using an LLM for deterministic logic

For example:

```text
Calculate tax according to a fixed legal formula.
```

If exactness matters, implement the deterministic calculation in code and use the LLM only where language understanding is needed.

---

# 35. Key Formula

A useful mental model:

```text
Zero-Shot Prompting
=
Instruction
+
Context
+
Input
+
Optional Constraints
+
Optional Output Format

❌ No Examples
```

---

# 36. Zero-Shot vs Few-Shot vs CoT

| Technique     |       Examples? | Main Purpose                  |
| ------------- | --------------: | ----------------------------- |
| **Zero-Shot** |            ❌ No | Direct instruction            |
| **One-Shot**  |             ✅ 1 | Show one pattern              |
| **Few-Shot**  |      ✅ Multiple | Teach desired pattern         |
| **CoT**       | Not necessarily | Encourage/decompose reasoning |
| **Persona**   | Not necessarily | Control role/style            |

These techniques can also be combined.

For example:

```text
Persona
   +
Few-Shot Examples
   +
Clear Instructions
   +
Structured Output
```

---

# 37. Final Mental Model

Remember Zero-Shot Prompting with:

```text
             ZERO-SHOT
                 │
       ┌─────────┴─────────┐
       │                   │
   INSTRUCTION          INPUT
       │                   │
       └─────────┬─────────┘
                 ▼
                LLM
                 │
                 ▼
              OUTPUT
```

### The one-line definition:

> **Zero-shot prompting means asking an LLM to perform a task using instructions and context, but without providing task-specific examples.**

### Most important Day 02 takeaway:

```text
Start Simple
    ↓
Zero-Shot
    ↓
Evaluate
    ↓
Improve Instructions
    ↓
Few-Shot if necessary
    ↓
Add Structure / Tools / RAG
    ↓
Production System
```

**Zero-shot prompting is usually the first prompting technique to try—not necessarily the final solution.**
