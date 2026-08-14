# 📘 Few-Shot Prompting — Detailed Notes

## 1. What is Few-Shot Prompting?

**Few-Shot Prompting** is a prompting technique where we provide an LLM with **one or more examples** showing how an input should be transformed into an expected output before giving it the actual task.

The examples are called **exemplars** or **demonstrations**.

### Simple Definition

> **Few-shot prompting = Teach the model the desired pattern using examples, then give it a new input.**

For example:

```text
Input: "I love this phone."
Output: Positive

Input: "This phone is terrible."
Output: Negative

Input: "The phone is okay."
Output:
```

The model infers:

```text
"The phone is okay." → Neutral
```

No model retraining is required.

---

# 2. Few-Shot Prompting Architecture

```text
                    FEW-SHOT PROMPTING

┌───────────────────────────────────────────────┐
│                  Prompt                       │
│                                               │
│  Instruction                                  │
│       ↓                                       │
│  Example 1: Input → Output                    │
│       ↓                                       │
│  Example 2: Input → Output                    │
│       ↓                                       │
│  Example 3: Input → Output                    │
│       ↓                                       │
│  Target Input                                 │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
                ┌─────────────┐
                │     LLM     │
                │             │
                │  Pattern    │
                │ Recognition │
                └──────┬──────┘
                       │
                       ▼
                 Target Output
```

The key difference from zero-shot is:

```text
Zero-Shot:
Instruction + Input → Output

Few-Shot:
Instruction + Examples + Input → Output
```

---

# 3. What is an Exemplar?

An **exemplar** is an example demonstrating the desired relationship between an input and its output.

Example:

```text
Input:
"Python is easy to learn."

Output:
Positive
```

This entire pair is an exemplar.

With multiple examples:

```text
Example 1
Input → Output

Example 2
Input → Output

Example 3
Input → Output
```

The model uses these examples to infer the task.

---

# 4. One-Shot vs Few-Shot

Prompting terminology is usually described like this:

```text
┌──────────────┬──────────────┐
│ Technique    │ Examples     │
├──────────────┼──────────────┤
│ Zero-Shot    │ 0            │
│ One-Shot     │ 1            │
│ Few-Shot     │ 2+           │
└──────────────┴──────────────┘
```

### Zero-Shot

```text
Classify:
"I love this product."
```

### One-Shot

```text
"I hate this product." → Negative

Classify:
"I love this product."
```

### Few-Shot

```text
"I hate this product." → Negative
"I love this product." → Positive
"The product is okay." → Neutral

Classify:
"The product is amazing."
```

---

# 5. Underlying Mechanism — In-Context Learning

Few-shot prompting is closely related to **In-Context Learning (ICL)**.

The model receives examples inside the prompt and uses them to infer the task's pattern.

Conceptually:

```text
Examples
   │
   ▼
Model reads relationships
   │
   ▼
Identifies pattern
   │
   ▼
Applies pattern to new input
   │
   ▼
Generates output
```

### Important Point

The examples **do not permanently train the model**.

The model's weights are not changed simply because you supplied examples in a prompt.

```text
Few-Shot Prompt
      │
      ▼
Temporary context
      │
      ▼
Model inference
      │
      ▼
Output

❌ Model weights are not updated
```

This is different from fine-tuning.

---

# 6. Few-Shot Prompting vs Fine-Tuning

This distinction is extremely important.

### Few-Shot

```text
Examples
   ↓
Prompt
   ↓
LLM
   ↓
Output
```

The examples exist only in the current context.

### Fine-Tuning

```text
Training Dataset
      ↓
Optimization
      ↓
Model Weights Updated
      ↓
Fine-Tuned Model
```

Therefore:

| Feature               | Few-Shot | Fine-Tuning                   |
| --------------------- | -------- | ----------------------------- |
| Examples in prompt    | ✅        | Not necessarily               |
| Changes model weights | ❌        | ✅                             |
| Persistent learning   | ❌        | ✅                             |
| Easy to modify        | ✅        | ❌                             |
| Runtime token cost    | Higher   | Usually lower prompt overhead |
| Training required     | ❌        | ✅                             |

---

# 7. Why Do Few-Shot Examples Help?

Suppose you tell the model:

```text
Classify the following text.
```

This leaves several questions:

* What labels should be used?
* What does each label mean?
* What output format should be used?
* How should ambiguous cases be handled?

Few-shot examples answer these questions implicitly.

For example:

```text
"I love this product."
→ POSITIVE

"This product is terrible."
→ NEGATIVE

"The product works."
→ NEUTRAL
```

Now the model can infer:

```text
Input characteristics
        ↓
Corresponding label
```

---

# 8. Pattern Learning

Consider a custom task:

```text
Input:
"Server response time improved."
Output:
FAST

Input:
"Server response time became worse."
Output:
SLOW

Input:
"Response time stayed unchanged."
Output:
STABLE
```

Now:

```text
Input:
"API latency decreased significantly."
Output:
?
```

The model can infer:

```text
API latency decreased
        ↓
Improvement
        ↓
FAST
```

The examples establish the meaning of the labels.

---

# 9. Few-Shot Prompt Structure

A good few-shot prompt often looks like:

```text
ROLE:
[Optional role]

TASK:
[Task description]

EXAMPLE 1:
Input: ...
Output: ...

EXAMPLE 2:
Input: ...
Output: ...

EXAMPLE 3:
Input: ...
Output: ...

TARGET INPUT:
...
```

For example:

```text
You are a sentiment classifier.

Task:
Classify each review as POSITIVE, NEGATIVE, or NEUTRAL.

Example 1:
Input: "The product is amazing."
Output: POSITIVE

Example 2:
Input: "The product completely failed."
Output: NEGATIVE

Example 3:
Input: "The product works as expected."
Output: NEUTRAL

Target:
"The product exceeded my expectations."
```

Expected:

```text
POSITIVE
```

---

# 10. Few-Shot for Strict Formatting

One of the biggest advantages of few-shot prompting is **output format control**.

Suppose your application needs:

```text
[ENTITY: X] | [SENTIMENT: Y]
```

Instead of simply describing the format, provide examples:

```text
Input:
"I love React."

Output:
[ENTITY: React] | [SENTIMENT: POSITIVE]

Input:
"Angular is difficult to maintain."

Output:
[ENTITY: Angular] | [SENTIMENT: NEGATIVE]

Input:
"The team is evaluating Vue."

Output:
[ENTITY: Vue] | [SENTIMENT: NEUTRAL]
```

Now the target:

```text
"The new Next.js application is incredibly fast."
```

Expected:

```text
[ENTITY: Next.js] | [SENTIMENT: POSITIVE]
```

---

# 11. Few-Shot Classification

Few-shot prompting is especially useful when classification categories are **custom or domain-specific**.

For example, suppose a company has support categories:

```text
AUTH
PAYMENT
BUG
FEATURE
```

The model may not know your company's exact definitions.

You can teach it through examples:

```text
"Password reset link isn't working."
→ AUTH

"My card was charged twice."
→ PAYMENT

"The dashboard crashes when I click export."
→ BUG

"Please add dark mode."
→ FEATURE
```

Now:

```text
"I forgot my account password."
→ ?
```

The model can infer:

```text
AUTH
```

---

# 12. Few-Shot for Edge Cases

Few-shot prompting becomes especially useful when standard definitions are insufficient.

For example, sentiment can be complicated:

```text
"The camera is fantastic, but the battery is awful."
```

A simple sentiment instruction might struggle.

You can provide examples that demonstrate your desired policy:

```text
"Great camera but terrible battery."
→ NEGATIVE

"Average camera but excellent battery."
→ POSITIVE
```

The examples communicate how your application wants ambiguous cases handled.

---

# 13. Few-Shot for Tone and Style

Few-shot prompting can teach the model a particular writing style.

### Example

```text
Input:
"Explain databases."

Output:
"Think of a database like a digital cupboard.
It stores your application's information neatly
so you can find it whenever you need it."

Input:
"Explain APIs."

Output:
```

The model can infer the desired style:

* Beginner-friendly
* Analogy-based
* Conversational
* Short

Possible output:

```text
"Think of an API like a waiter in a restaurant.
You make a request, the waiter talks to the kitchen,
and brings the result back to you."
```

---

# 14. Few-Shot for Brand Voice

Companies can provide examples of their preferred communication style.

```text
Example 1:
"Build faster. Ship smarter."

Example 2:
"Your ideas deserve better tools."

Example 3:
"Turn complexity into simplicity."

Task:
Write a product announcement.
```

The model can infer the general style:

* Short
* Confident
* Marketing-oriented
* Action-focused

---

# 15. Few-Shot for Custom Vocabulary

Suppose a company uses internal abbreviations.

```text
"PRD"
→ Product Requirements Document

"ADR"
→ Architecture Decision Record

"RFC"
→ Request for Comments
```

Now:

```text
"Create an ADR for the authentication redesign."
```

The model understands the company's intended terminology from the examples.

---

# 16. Few-Shot Translation

Few-shot prompting can also teach custom translations.

Suppose your company has special terminology:

```text
"Workspace"
→ कार्यक्षेत्र

"Dashboard"
→ डैशबोर्ड

"Deployment"
→ परिनियोजन
```

Then:

```text
Translate:
"Open the deployment dashboard."
```

The model can follow the established vocabulary.

This is particularly useful when ordinary dictionary translation isn't enough.

---

# 17. Few-Shot Code Generation

Examples can teach a specific coding style.

```text
Example:

Input:
Create a function that adds two numbers.

Output:
const add = (a, b) => a + b;

Input:
Create a function that multiplies two numbers.

Output:
```

The model may produce:

```javascript
const multiply = (a, b) => a * b;
```

The example teaches:

* Arrow functions
* Parameter style
* Naming convention
* Compact syntax

---

# 18. Few-Shot Data Extraction

Suppose you want to extract information from invoices.

Examples:

```text
Input:
"Invoice #1234, total ₹5,000."

Output:
{
  "invoice_id": "1234",
  "amount": 5000
}
```

Another:

```text
Input:
"Invoice #5678, total ₹2,500."

Output:
{
  "invoice_id": "5678",
  "amount": 2500
}
```

Target:

```text
"Invoice #9001, total ₹7,200."
```

Expected:

```json
{
  "invoice_id": "9001",
  "amount": 7200
}
```

For production, however, use schema validation/structured outputs when available rather than relying solely on examples.

---

# 19. Few-Shot Example: Tech Stack + Sentiment

Your provided example is a good practical demonstration.

### Task

```text
Extract:
1. Technology entities
2. Sentiment

Format:
[ENTITIES: ...] | [SENTIMENT: ...]
```

### Example 1

```text
Input:
"We migrated our Django API server to FastAPI,
and our query latency dropped by 50%!"

Output:
[ENTITIES: Django, FastAPI] | [SENTIMENT: POSITIVE]
```

### Example 2

```text
Input:
"We tried using MongoDB for our transactional
banking ledger, and it was a complete disaster."

Output:
[ENTITIES: MongoDB] | [SENTIMENT: NEGATIVE]
```

### Example 3

```text
Input:
"The team is currently evaluating Docker vs Podman
for local containerization."

Output:
[ENTITIES: Docker, Podman] | [SENTIMENT: NEUTRAL]
```

### Target

```text
"We built the dashboard in SvelteKit and deployed
on Vercel, it feels incredibly snappy."
```

The model should infer:

```text
[ENTITIES: SvelteKit, Vercel] | [SENTIMENT: POSITIVE]
```

---

# 20. Groq Node.js Example

Using the Groq SDK:

```javascript
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const prompt = `
Task:
Extract tech stack entities mentioned in the review
and classify sentiment.

Format:
[ENTITIES: <comma-separated-entities>] |
[SENTIMENT: <POSITIVE|NEGATIVE|NEUTRAL>]

Example 1:
Input: "We migrated our Django API server to FastAPI,
and our query latency dropped by 50%!"
Output: [ENTITIES: Django, FastAPI] | [SENTIMENT: POSITIVE]

Example 2:
Input: "We tried using MongoDB for our transactional
banking ledger, and it was a complete disaster."
Output: [ENTITIES: MongoDB] | [SENTIMENT: NEGATIVE]

Example 3:
Input: "The team is evaluating Docker vs Podman
for local containerization."
Output: [ENTITIES: Docker, Podman] | [SENTIMENT: NEUTRAL]

Target:
"We built the dashboard in SvelteKit and deployed
on Vercel, it feels incredibly snappy."

Output:
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    console.log(
      "Few-Shot Output:\n",
      response.choices[0].message.content
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
```

### Pipeline

```text
JavaScript Application
        │
        ▼
 Few-Shot Prompt
        │
        ├── Instruction
        ├── Example 1
        ├── Example 2
        ├── Example 3
        └── Target Input
        │
        ▼
      Groq API
        │
        ▼
     Llama Model
        │
        ▼
    Target Output
```

---

# 21. Why Use Multiple Examples?

One example might not communicate the entire task.

Suppose:

```text
Example:
"This product is excellent."
→ POSITIVE
```

This only demonstrates one case.

Instead:

```text
Positive example
Negative example
Neutral example
```

gives the model a better understanding of the classification boundaries.

```text
             Examples
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
   Positive   Negative    Neutral
      │          │          │
      └──────────┼──────────┘
                 ▼
          Target Input
                 │
                 ▼
          Classification
```

---

# 22. Choosing Good Examples

The quality of your exemplars matters significantly.

### Good examples should be:

* Relevant to the target task
* Clear
* Correct
* Representative
* Consistent
* Diverse enough to cover important cases

### Poor examples:

```text
Example 1 → unclear
Example 2 → incorrect
Example 3 → unrelated
```

can teach the model the wrong pattern.

---

# 23. Example Diversity

Suppose you are building sentiment classification.

Don't use:

```text
Example 1 → Positive
Example 2 → Positive
Example 3 → Positive
Example 4 → Positive
```

Instead:

```text
Example 1 → Positive
Example 2 → Negative
Example 3 → Neutral
```

If your real data contains edge cases, include representative examples.

---

# 24. Exemplar Bias

Few-shot examples can introduce **bias** into the model's interpretation.

For example:

```text
Database migration → Positive
Database upgrade → Positive
Database optimization → Positive
```

The model may start associating database-related topics with positive sentiment.

Then:

```text
"The database migration caused a complete outage."
```

could potentially be misclassified.

### Lesson

> Examples should represent the task, not accidentally encode unrelated correlations.

---

# 25. Token Overhead

Few-shot prompting requires additional tokens.

Zero-shot:

```text
Instruction
+
Input
```

Few-shot:

```text
Instruction
+
Example 1
+
Example 2
+
Example 3
+
Input
```

Therefore:

```text
More examples
      ↓
More input tokens
      ↓
Higher context usage
      ↓
Potentially higher cost
      ↓
Potentially higher latency
```

This becomes important in production.

---

# 26. Context Window Limitations

Every model has a finite context window.

Suppose your prompt contains:

```text
100 examples
+
Large documents
+
Long instructions
+
Target input
```

Eventually, you may run into context limitations.

Therefore:

> **More examples do not automatically mean better results.**

You want **useful examples**, not simply more examples.

---

# 27. Overfitting to Examples

A model can sometimes copy unnecessary details from demonstrations.

For example:

```text
Example:
Input → {"name": "...", "age": "...", "city": "..."}
```

But the target contains only:

```text
Name: Aminul
```

The model might incorrectly generate:

```json
{
  "name": "Aminul",
  "age": null,
  "city": null
}
```

even though those fields weren't requested.

This is an example of **format/example leakage**.

---

# 28. Formatting Drift

Few-shot examples can strongly influence formatting, but the model can still make mistakes.

Suppose every example is:

```text
[ENTITY: X] | [SENTIMENT: Y]
```

The model might accidentally produce:

```text
Entity: X
Sentiment: Y
```

instead.

To reduce this:

* Make examples consistent
* Clearly state the format
* Use low randomness where appropriate
* Validate the output
* Retry/repair invalid results

---

# 29. Example Ordering

The order of examples can sometimes influence model behavior.

A useful structure is:

```text
Instruction
   ↓
Examples
   ↓
Target
```

Avoid putting unrelated content between examples and the target.

Keep the prompt easy to parse.

---

# 30. Few-Shot Prompting Best Practices

## 1. Clearly define the task

```text
Task:
Classify the sentiment.
```

---

## 2. Show consistent examples

```text
Input:
...

Output:
...
```

Use the same structure for every example.

---

## 3. Cover important classes

If there are three classes:

```text
Positive
Negative
Neutral
```

try to demonstrate each important category.

---

## 4. Use representative examples

Examples should resemble real production inputs.

---

## 5. Include edge cases

If your application frequently encounters ambiguous inputs, demonstrate how those should be handled.

---

## 6. Keep examples concise

Don't include unnecessary text.

```text
Bad:
Large irrelevant example

Good:
Small representative example
```

---

## 7. Explicitly define the output format

```text
Return only:
[ENTITY: X] | [SENTIMENT: Y]
```

---

## 8. Validate the output

Few-shot prompting is not a replacement for application-level validation.

```text
LLM
 ↓
Parser
 ↓
Schema validation
 ↓
Valid?
 ├── Yes → Continue
 └── No → Retry / Repair
```

---

# 31. Few-Shot + Structured Outputs

Few-shot prompting and structured outputs can work together.

```text
Few-Shot Examples
       +
Output Schema
       ↓
      LLM
       ↓
Structured Result
       ↓
Validation
```

Examples teach the **pattern**, while the schema provides a stronger machine-readable contract.

---

# 32. Few-Shot + Guardrails

Production architecture:

```text
                User Input
                    │
                    ▼
              Input Guardrail
                    │
                    ▼
              Few-Shot Prompt
                    │
          ┌─────────┴─────────┐
          │                   │
      Examples            Target Input
          │                   │
          └─────────┬─────────┘
                    ▼
                   LLM
                    │
                    ▼
             Output Guardrail
                    │
                    ▼
              Application
```

---

# 33. Few-Shot + RAG

For knowledge-intensive systems, few-shot prompting can be combined with retrieval.

```text
User Query
    │
    ▼
Retriever
    │
    ▼
Relevant Documents
    │
    ├─────────────┐
    │             │
    ▼             ▼
Few-Shot       Context
Examples       Documents
    │             │
    └──────┬──────┘
           ▼
          LLM
           │
           ▼
         Answer
```

This separates two responsibilities:

* **Examples** → teach behavior/format
* **Retrieved context** → provide current/domain information

---

# 34. Few-Shot vs Zero-Shot

| Feature               | Zero-Shot     | Few-Shot             |
| --------------------- | ------------- | -------------------- |
| Examples              | ❌ None        | ✅ One or more        |
| Prompt size           | Smaller       | Larger               |
| Token usage           | Lower         | Higher               |
| Setup                 | Very simple   | Requires examples    |
| Format control        | Moderate      | Usually better       |
| Custom classification | Limited       | Stronger             |
| Custom style          | Limited       | Better               |
| Edge cases            | Can struggle  | Can demonstrate them |
| Cost                  | Usually lower | Usually higher       |
| Fine-tuning required  | ❌             | ❌                    |

---

# 35. Few-Shot vs Fine-Tuning

Another important comparison:

```text
Few-Shot
──────────────
Examples in prompt
        ↓
Temporary context
        ↓
LLM response


Fine-Tuning
──────────────
Training examples
        ↓
Training process
        ↓
Updated model weights
        ↓
Persistent behavior
```

Use few-shot when:

* You want fast experimentation
* The task changes frequently
* You have relatively few examples
* You don't want to train a model

Consider fine-tuning when:

* The behavior needs to be persistent
* You have a large/high-quality dataset
* Prompt examples are becoming too expensive
* You need consistent specialized behavior

---

# 36. When Should You Use Few-Shot Prompting?

Use it when zero-shot isn't giving sufficiently consistent results.

A practical progression:

```text
             Start
               │
               ▼
           Zero-Shot
               │
               ▼
        Evaluate Results
               │
        ┌──────┴──────┐
        │             │
      Good          Poor
        │             │
        ▼             ▼
       Done       Add Examples
                      │
                      ▼
                  Few-Shot
                      │
                      ▼
                   Evaluate
```

---

# 37. Common Mistakes

### ❌ Mistake 1: Using bad examples

Bad examples teach bad behavior.

```text
Bad example → Bad pattern → Bad output
```

---

### ❌ Mistake 2: Inconsistent formatting

Example:

```text
Input: ...
Output: ...
```

Another:

```text
Question: ...
Answer: ...
```

Keep the structure consistent.

---

### ❌ Mistake 3: Too many examples

More examples increase:

* Token usage
* Latency
* Cost
* Context consumption

Use the **smallest useful set**.

---

### ❌ Mistake 4: Examples don't match production data

If production inputs are technical documents but examples are casual conversations, the demonstrations may not generalize well.

---

### ❌ Mistake 5: Forgetting validation

Even with excellent examples:

```text
LLM output ≠ guaranteed valid
```

Always validate important outputs.

---

# 38. Practical Few-Shot Template

You can use this structure:

```text
ROLE:
You are a [role].

TASK:
[Describe the task.]

OUTPUT FORMAT:
[Describe exact output format.]

EXAMPLE 1:
Input:
[example input]

Output:
[example output]

EXAMPLE 2:
Input:
[example input]

Output:
[example output]

EXAMPLE 3:
Input:
[example input]

Output:
[example output]

TARGET:
[target input]

OUTPUT:
```

---

# 39. Advanced Mental Model

Think of few-shot prompting as **teaching by demonstration**:

```text
               FEW-SHOT
                  │
                  ▼
        ┌──────────────────┐
        │ Demonstrations   │
        └────────┬─────────┘
                 │
                 ▼
          Pattern Inference
                 │
        ┌────────┴────────┐
        ▼                 ▼
   Input Pattern     Output Pattern
        │                 │
        └────────┬────────┘
                 ▼
            Target Input
                 │
                 ▼
            Target Output
```

---

# 40. Final Mental Model

Remember the difference with this:

```text
ZERO-SHOT
─────────
"Do this."
     ↓
LLM
     ↓
Output


FEW-SHOT
─────────
"Do this."

Example → Output
Example → Output
Example → Output

Target Input
     ↓
LLM
     ↓
Output following the demonstrated pattern
```

### One-line definition

> **Few-shot prompting provides examples inside the prompt so the LLM can infer the desired task, behavior, format, or classification pattern without changing the model's weights.**

### Key takeaway

```text
Examples
   ↓
Pattern
   ↓
Target
   ↓
Consistent Output
```

**Use Zero-Shot when the task is straightforward. Use Few-Shot when examples can communicate a custom pattern, format, style, or classification rule more effectively than instructions alone.**
