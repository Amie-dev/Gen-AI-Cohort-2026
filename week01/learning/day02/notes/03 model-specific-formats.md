# 📘 Model-Specific Prompt Formatting — Detailed Notes

## 1. What Is Model-Specific Prompt Formatting?

When we use an LLM API, we usually write messages like:

```javascript
const messages = [
  {
    role: "system",
    content: "You are a helpful assistant."
  },
  {
    role: "user",
    content: "What is JavaScript?"
  }
];
```

It looks like the model receives this JavaScript object directly.

**It usually doesn't.**

At some layer, the conversation needs to be converted into a representation the model was trained to understand.

Conceptually:

```text
JavaScript Messages
        │
        ▼
┌──────────────────────┐
│ API / Chat Template  │
└──────────┬───────────┘
           │
           ▼
Formatted Token Sequence
           │
           ▼
        Tokenizer
           │
           ▼
       Transformer
           │
           ▼
        Output
```

The important concept is:

> **A chat model is trained with particular conventions for representing roles and turns.**

---

# 2. Why Does Formatting Exist?

A transformer fundamentally processes a sequence of tokens.

It doesn't inherently see:

```javascript
{
  role: "user",
  content: "Hello"
}
```

as a special JavaScript object.

Instead, the information eventually becomes a sequence of tokens.

For example, conceptually:

```text
SYSTEM
"You are a tutor."

USER
"Explain closures."

ASSISTANT
```

may be serialized using a model-specific template.

The exact serialization depends on the model and tokenizer/template.

---

# 3. The General Pipeline

A useful mental model is:

```text
             Chat Messages
                  │
                  ▼
          Chat Template
                  │
                  ▼
       Serialized Text / Tokens
                  │
                  ▼
              Tokenizer
                  │
                  ▼
             Token IDs
                  │
                  ▼
            Transformer
                  │
                  ▼
          Predicted Tokens
                  │
                  ▼
              Response
```

For example:

```text
messages
   ↓
<|user|> Explain React <|end|>
   ↓
Tokenizer
   ↓
[Token IDs...]
   ↓
Model
   ↓
[Token IDs...]
   ↓
Decoder
   ↓
"React is..."
```

---

# 4. Important Terminology

Several terms are useful here.

### Chat template

A template describing how structured conversation messages are converted into the model's expected token sequence.

### Special tokens

Tokens with special semantic purposes.

Examples can include:

```text
<|bos|>
<|eos|>
<|user|>
<|assistant|>
```

The actual tokens vary between model families.

### Instruction format

The overall convention used to represent instructions, inputs, responses, and roles.

### Tokenizer

Converts text into tokens/token IDs that the model can process.

---

# 5. Chat Templates

Modern open-source instruction/chat models often publish or package a **chat template** with the tokenizer configuration.

This is important because you generally should **not manually guess the format**.

For example, Hugging Face tooling can often apply the model's configured template:

```python
tokenizer.apply_chat_template(
    messages,
    tokenize=True,
    add_generation_prompt=True
)
```

Conceptually:

```text
messages
   ↓
apply_chat_template()
   ↓
Model's expected format
   ↓
Tokenizer
   ↓
Model
```

This is much safer than manually writing:

```text
<something>
<something else>
```

without knowing what the model expects.

---

# 6. ChatML

ChatML is a historical/commonly discussed chat-format convention associated with OpenAI research and earlier model tooling.

A simplified representation looks like:

```text
<|im_start|>system
You are a helpful assistant.
<|im_end|>

<|im_start|>user
What is JavaScript?
<|im_end|>

<|im_start|>assistant
```

The structure is:

```text
<|im_start|>
ROLE
CONTENT
<|im_end|>
```

Conceptually:

```text
┌─────────────────────────────┐
│ <|im_start|>system          │
│ System instruction          │
│ <|im_end|>                  │
├─────────────────────────────┤
│ <|im_start|>user            │
│ User question               │
│ <|im_end|>                  │
├─────────────────────────────┤
│ <|im_start|>assistant        │
│                             │
└─────────────────────────────┘
```

The final assistant marker tells the model:

> Generate the assistant's response here.

---

# 7. Why Special Tokens Matter

Consider:

```text
<|im_start|>user
What is React?
<|im_end|>
<|im_start|>assistant
```

The model can learn patterns such as:

```text
USER
   ↓
question
   ↓
ASSISTANT
   ↓
answer
```

Without appropriate boundaries, the model has less explicit information about where one conversational turn ends and another begins.

This can lead to undesirable behavior such as:

```text
User: Explain React.

Assistant: React is...
User: And React Native...
Assistant: ...
```

instead of producing only the intended assistant response.

---

# 8. Alpaca Format

Alpaca-style instruction tuning became popular through Stanford's Alpaca work.

A simplified format is:

```text
### Instruction:
Calculate the area of a circle.

### Input:
Radius = 5

### Response:
The area is approximately 78.54.
```

The basic structure is:

```text
Instruction
     ↓
Input
     ↓
Response
```

Diagram:

```text
┌─────────────────────┐
│ ### Instruction:    │
│ User task           │
├─────────────────────┤
│ ### Input:          │
│ Additional context  │
├─────────────────────┤
│ ### Response:       │
│ Model answer        │
└─────────────────────┘
```

---

# 9. Why Alpaca Worked

Instruction-tuned models learn patterns from many examples like:

```text
Instruction → Response
```

For example:

```text
Instruction:
Translate "Hello" to French.

Response:
Bonjour.
```

The model learns to associate the instruction section with a corresponding response.

---

# 10. Llama Instruction Formats

Llama model generations have used specific instruction/chat templates.

For example, Llama 2's instruction format commonly used:

```text
<s>[INST] <<SYS>>
You are a helpful assistant.
<</SYS>>

Explain recursion. [/INST]
```

Conceptually:

```text
<s>
   ↓
[INST]
   ↓
System instruction
   ↓
User instruction
   ↓
[/INST]
   ↓
Assistant response
```

---

# 11. Important Llama Version Difference

Don't assume:

```text
Llama 2 format = Llama 3 format
```

Llama model generations can use different chat templates and special tokens.

For example, newer Llama models use formats involving tokens such as:

```text
<|begin_of_text|>
<|start_header_id|>
<|end_header_id|>
<|eot_id|>
```

The exact template should be taken from the **specific model's tokenizer/chat-template configuration**.

Therefore:

> **Never manually copy a Llama 2 prompt format and assume it works optimally for every Llama model.**

---

# 12. FLAN-T5

FLAN-T5 uses an instruction-oriented text-to-text approach.

Instead of requiring a complex chat structure, tasks can be represented directly.

Example:

```text
Translate English to German:
The weather is nice today.
```

Expected output:

```text
Das Wetter ist heute schön.
```

Another example:

```text
Classify the sentiment:
"I love this product."

Positive
```

The fundamental idea is:

```text
Task Description + Input
          ↓
       Model
          ↓
       Output
```

This is different from the multi-turn chat-template approach used by many modern chat models.

---

# 13. Base Model vs Instruction Model

This distinction is extremely important.

## Base Model

A base language model is primarily trained to predict the next token from text.

Conceptually:

```text
"The capital of France is"
                    ↓
                  Paris
```

It isn't necessarily optimized to behave like a conversational assistant.

---

## Instruction-Tuned Model

An instruction-tuned model has additional training to follow instructions.

Example:

```text
User:
Explain recursion.

Model:
Recursion is...
```

So:

```text
Base Pretraining
       ↓
Instruction Fine-Tuning
       ↓
Chat / Instruction Model
```

---

# 14. Why Chat Templates Are Important for Fine-Tuned Models

Suppose a model was trained using:

```text
USER:
Explain React.

ASSISTANT:
React is...
```

If you give it:

```text
Question:
Explain React.
Answer:
```

the model might still produce something useful, but you're no longer matching the distribution it was trained on as closely.

The model may perform worse.

That's why the **correct chat template** matters.

---

# 15. Training Format → Inference Format

One of the most important ideas is:

```text
TRAINING FORMAT
      │
      ▼
Model learns pattern
      │
      ▼
INFERENCE FORMAT
      │
      ▼
Should resemble training convention
```

Suppose training examples look like:

```text
<USER>
Question
<ASSISTANT>
Answer
```

At inference time, you want the prompt structure to follow the model's expected template.

---

# 16. What Happens If You Use the Wrong Format?

Potential problems include:

### 1. Poor instruction following

```text
"Do exactly this..."
        ↓
Model doesn't interpret the instruction correctly
```

### 2. Formatting drift

The model may output unwanted template markers.

### 3. Role confusion

The model may continue generating user-like text.

### 4. Lower quality

The model may perform worse than when using the correct template.

### 5. Unexpected responses

For example:

```text
User: Explain JavaScript.

Assistant: Explain JavaScript.
User: JavaScript is...
```

Instead of simply answering.

---

# 17. Why APIs Hide This Complexity

When using a hosted API, you often write:

```javascript
const messages = [
  {
    role: "system",
    content: "You are a tutor."
  },
  {
    role: "user",
    content: "Explain recursion."
  }
];
```

You don't usually manually construct:

```text
<|start_header_id|>
...
```

The provider's SDK/API handles much of the serialization.

Conceptually:

```text
Your Code
   ↓
messages[]
   ↓
Provider API
   ↓
Correct serialization/template
   ↓
Model
```

This is one reason hosted APIs are easier to use.

---

# 18. Raw Local Models

When working closer to the model itself, you may have to care about templates.

For example:

```text
Ollama
Hugging Face Transformers
llama.cpp
vLLM
custom inference servers
```

Modern tooling often handles templates automatically, but understanding them helps when debugging.

---

# 19. Ollama Example

With Ollama, you generally interact with a model using its API rather than manually writing every special token.

Conceptually:

```javascript
const response = await ollama.chat({
  model: "some-model",
  messages: [
    {
      role: "user",
      content: "Explain closures."
    }
  ]
});
```

Ollama/model metadata can determine how the conversation should be formatted.

The important lesson is:

> **Use the runtime's supported chat interface/template instead of manually injecting special tokens unless you have a specific reason to do so.**

---

# 20. Hugging Face Example

For models whose tokenizer provides a chat template, you can do something conceptually like:

```python
messages = [
    {
        "role": "system",
        "content": "You are a helpful assistant."
    },
    {
        "role": "user",
        "content": "Explain closures."
    }
]

prompt = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)
```

Then:

```text
messages
    ↓
chat_template
    ↓
formatted prompt
    ↓
tokenizer
    ↓
model
```

This is the preferred pattern when the model provides a template.

---

# 21. What Is `add_generation_prompt`?

This is an especially useful concept.

Suppose your conversation ends with:

```text
User:
Explain closures.
```

The model needs to know:

> "Now it is the assistant's turn to respond."

A generation prompt adds whatever assistant-start structure the model expects.

Conceptually:

```text
User message
     ↓
Assistant-generation marker
     ↓
Model starts generating
```

For different models, that marker may be completely different.

---

# 22. Special Tokens

Models may have special tokens representing things such as:

```text
Beginning of sequence
End of sequence
User
Assistant
System
End of turn
Tool call
Tool result
```

Examples from various model families include:

```text
<|bos|>
<|eos|>
<|eot_id|>
<|start_header_id|>
```

**These are model-specific.**

Don't assume that one model's special tokens work with another model.

---

# 23. Tokenization

After formatting, the text is tokenized.

For example:

```text
"Hello world"
```

might conceptually become:

```text
["Hello", " world"]
```

The actual tokenization depends on the tokenizer.

Then tokens become IDs:

```text
["Hello", " world"]
        ↓
[15496, 995]
```

The exact IDs are tokenizer-specific.

---

# 24. Complete Pipeline

The complete process can be visualized as:

```text
┌──────────────────────────┐
│ Application Messages     │
│                          │
│ system                   │
│ user                     │
│ assistant                │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Chat Template            │
│                          │
│ Model-specific format    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Tokenizer                │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Token IDs                │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Transformer Model        │
└────────────┬─────────────┘
             │
             ▼
       Generated Tokens
```

---

# 25. Chat Template vs Prompt Engineering

These are related but different.

### Prompt engineering

You decide **what to tell the model**.

Example:

```text
You are a senior JavaScript engineer.
Explain closures with an example.
```

### Chat template

The model/runtime decides **how the conversation is encoded for the model**.

Example:

```text
<user>
You are a senior JavaScript engineer...
```

So:

```text
Prompt Engineering
      +
Chat Template
      ↓
Model Input
```

---

# 26. Don't Confuse Formatting With Model Intelligence

Using the correct template does not magically make a weak model powerful.

It simply gives the model the input structure it was trained to interpret.

Think of it like programming syntax.

This:

```javascript
const name = "Aminul";
```

follows JavaScript syntax.

This:

```text
const name = Aminul
```

might not.

Similarly, a model's expected chat template is part of the interface between your application and the model.

---

# 27. Model-Specific Doesn't Mean "Every Model Is Completely Different"

Many modern models use similar concepts:

```text
System
User
Assistant
Tool
End of turn
```

But their **token-level representation** can differ.

For example:

```text
Model A
<|user|> ... <|assistant|>

Model B
[INST] ... [/INST]

Model C
<|start_header_id|>user...
```

Same conceptual conversation:

```text
USER → ASSISTANT
```

Different encoding.

---

# 28. Practical Rule for Developers

When using a model:

### ❌ Don't do this

```text
I found this prompt format online.
I'll use it with every model.
```

### ✅ Do this

```text
1. Identify the exact model.
2. Check its tokenizer/chat template.
3. Use the provider/runtime's chat API when possible.
4. Let the tokenizer apply the template.
5. Test instruction following.
```

---

# 29. Debugging Checklist

If a local model behaves strangely, check:

```text
□ Am I using an instruction/chat model?
□ Am I using the correct model version?
□ Does the tokenizer have a chat template?
□ Am I applying the correct template?
□ Did I add the generation prompt?
□ Are special tokens being handled correctly?
□ Am I accidentally duplicating system/user markers?
□ Am I manually adding tokens that the runtime already adds?
```

---

# 30. Important Correction to the Original Notes

One statement in the original notes is a little too absolute:

> "LLMs do not natively understand the structured arrays of JSON messages."

A better explanation is:

> **The underlying model operates on token sequences, while the API exposes higher-level structured message objects. The API/runtime converts those messages into the model's expected token sequence using an appropriate serialization or chat template.**

Also, not every model necessarily requires manually visible formats such as ChatML or `[INST]`.

Modern libraries often automatically apply the correct template.

---

# 31. Another Important Correction

The statement:

> "ChatML was pioneered by OpenAI"

is useful as historical context, but you should avoid treating ChatML as the universal modern OpenAI wire format.

Modern APIs abstract message formatting away from developers, and different model families use different internal serialization conventions.

So the practical lesson is:

> **Don't manually emulate an old prompt format just because you saw it in an example. Use the current API or the model's configured chat template.**

---

# 32. Comparison Table

| Format / Concept      | Associated With                              | Main Idea                               |
| --------------------- | -------------------------------------------- | --------------------------------------- |
| ChatML-style          | OpenAI research / historical chat formatting | Explicit role boundaries                |
| Alpaca                | Stanford Alpaca                              | Instruction/Input/Response              |
| Llama 2 `[INST]`      | Llama 2                                      | Instruction delimiters + system block   |
| Llama 3 templates     | Llama 3 family                               | Header/end-of-turn special tokens       |
| FLAN-T5               | Google                                       | Text-to-text instruction format         |
| Modern chat templates | Many open models                             | Tokenizer-defined conversation template |

---

# 33. API vs Raw Model

This distinction is extremely important for your Gen AI development.

### Hosted API

```text
Your JavaScript
     ↓
SDK
     ↓
Provider API
     ↓
Formatting handled by provider
     ↓
Model
```

You generally work with:

```javascript
messages
```

### Local / lower-level inference

```text
Your application
     ↓
Chat template
     ↓
Tokenizer
     ↓
Model
```

You may have to understand:

```text
special tokens
chat template
generation prompt
tokenizer
```

---

# 34. Connection With Your Previous Topic: Chat Roles

Yesterday's concept:

```text
system
user
assistant
tool
```

Today:

```text
How are these roles actually represented
to the model?
```

Answer:

```text
Chat Roles
    ↓
Chat Template
    ↓
Special Tokens / Serialized Sequence
    ↓
Tokenizer
    ↓
Transformer
```

This is the key connection between **API-level chat roles** and the **underlying model**.

---

# 🧠 Final Mental Model

Remember this:

```text
                 YOUR APPLICATION
                        │
                        ▼
              messages / chat roles
                        │
                        ▼
                CHAT TEMPLATE
                        │
                        ▼
             MODEL-SPECIFIC FORMAT
                        │
                        ▼
                    TOKENIZER
                        │
                        ▼
                   TOKEN IDs
                        │
                        ▼
                 TRANSFORMER
                        │
                        ▼
                GENERATED TOKENS
                        │
                        ▼
                    RESPONSE
```

### One-line summary:

> **Chat roles are the high-level conversation structure; chat templates convert that structure into the model-specific token sequence the model was trained to understand.**

This concept becomes especially important when you move from **API-based LLM usage → Ollama/local models → Hugging Face → custom inference → agents**, because you'll start seeing exactly where the abstraction layers change.
