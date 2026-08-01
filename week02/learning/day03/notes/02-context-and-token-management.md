# Context and Token Management

This note covers the concept of context windows, token cost optimization, context management strategies, hallucinations, and inference.

---

## 1. Context Window

The **Context Window** is the maximum memory buffer an LLM can process in a single request/response turn. It is measured in **Tokens** (which are sub-word units of text; ~4 characters or 0.75 words per token).

Everything passed to or returned from the API counts towards this limit:
1. System Prompt
2. Historical Conversation Logs
3. Active User Input
4. External Tool outputs
5. Final Assistant completion response

### Context Window Limits by Model:
- **Older models (e.g., GPT-3):** ~2K tokens
- **Modern standard models (e.g., GPT-4o, Claude 3.5 Sonnet):** 128K to 200K tokens
- **Ultra-large models (e.g., Gemini 1.5/2.0):** 1M to 2M+ tokens

---

## 2. Problems with Large Context Windows

Even if a model supports millions of tokens, dumping excessive information into the prompt is bad practice:
* **Cost:** Billing is linear based on the number of tokens (Input and Output).
* **Latency (Slower responses):** Processing larger prompts takes more computation time.
* **Loss of reasoning/retrieval quality:** LLMs can suffer from the "lost in the middle" phenomenon, where they miss details buried in the middle of long prompts.
* **Increased Hallucinations:** Sifting through irrelevant details can confuse the reasoning engine.

---

## 3. Context Window Management

To keep chat agents running efficiently, developers use state management strategies:

* **Conversation Summarization:**Periodically instructing an LLM to summarize older messages and replacing them with a single summary block.
* **Sliding Window:** Keeping only the last $N$ messages in the active buffer.
* **Retrieval-Augmented Generation (RAG):** Searching a vector database for relevant documentation fragments and only inserting matching snippets instead of entire manuals.
* **Semantic Filtering:** Removing duplicate info or trailing whitespace.

---

## 4. Token Cost Structure

API providers charge based on:
$$\text{Total Cost} = (\text{Input Tokens} \times \text{Input Rate}) + (\text{Output Tokens} \times \text{Output Rate})$$

> [!NOTE]
> Output tokens are generally $3\times$ to $4\times$ more expensive to generate than input tokens because each token generated requires a full forward pass through the transformer network.

---

## 5. Hallucination

A **hallucination** occurs when a model generates responses that are factually false, ungrounded in the context, or fabricated, but presented with high confidence.

### Causes:
* Out-of-distribution prompts.
* Unclear instruction logic.
* Attempting to retrieve knowledge the model was never trained on.
* Poor context window clean-up.

---

## 6. Inference

**Inference** is the production phase where a fully trained model is queried to run reasoning or make predictions on new inputs.
* **Training:** Heavy compute phase where the model learns weights from raw data.
* **Inference:** Lightweight execution phase where a user sends a prompt and gets a text response.
