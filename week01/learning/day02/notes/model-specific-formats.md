# Model-Specific Prompt Formatting

Large Language Models (LLMs) are trained on raw text sequences. In-context chat arrays (`[{role: 'user', content: 'hello'}]`) must be serialized into a single raw text stream before being processed by the transformer engine. 

Each open-source or proprietary model family is trained on a specific formatting syntax. Using the wrong format when querying raw models directly (e.g. via Ollama or HuggingFace) causes performance degradation, formatting drift, and model breakdown.

---

## ⚡ 1. ChatML (Chat Markup Language)
Pioneered by OpenAI, ChatML provides clear semantic separation of messages using tags like `<|im_start|>` and `<|im_end|>`.

### Text Representation:
```text
<|im_start|>system
You are a brief math assistant.<|im_end|>
<|im_start|>user
What is 2+2?<|im_end|>
<|im_start|>assistant
2+2 is 4.<|im_end|>
```

---

## 🏔️ 2. Alpaca Format
Developed by Stanford for instruction-following models, it uses explicit section headers:

### Text Representation:
```text
### Instruction:
Calculate the area of a circle with radius 5.

### Input:
Formula: pi * r^2

### Response:
The area is 25 * pi ≈ 78.54.
```

---

## 🦙 3. Llama 2 / Llama 3 `[INST]` Format
Meta's models use tags to separate instruction sets (`[INST]`) and system instructions (`<<SYS>>`):

### Text Representation (Llama 2):
```text
<s>[INST] <<SYS>>
You are a helpful software tutor.
<</SYS>>

Explain recursion in one sentence. [/INST] Recursion is a programming technique where a function calls itself to solve a problem. </s>
```

---

## 🪐 4. FLAN-T5 Format
Google's FLAN-T5 is trained on highly direct, imperative template tasks:

### Text Representation:
```text
Translate this sentence to German: "The weather is nice today."
Translation: Es ist heute schönes Wetter.
```

---

## 🧠 Why Does Formatting Matter?
When instruction models are fine-tuned, they learn that:
1. They should only generate tokens immediately following the `### Response:` or `<|im_start|>assistant` tags.
2. They should never output the tags themselves, as these tags represent token sequences indicating role shifts.

If you omit or corrupt these syntax markers, the model will fail to understand where the user instruction ends and where its response should begin, causing it to hallucinate, repeat the instruction, or speak as both the user and assistant.
