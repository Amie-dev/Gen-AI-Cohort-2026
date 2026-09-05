# Chapter 5 — Two-Pass Retrieval & LLM Librarian with Gemini

## 1. Chapter Goal

The goal of this chapter is to build the **`TwoPassRetriever` Class** (`src/wiki/TwoPassRetriever.js`) and **`LLMLibrarian` Class** (`src/wiki/LLMLibrarian.js`).

Standard RAG sends full document chunks directly into embedding models. The **LLM Wiki Two-Pass Paradigm** mimics how a human librarian searches a library:
1. **Pass 1 (Catalog Search)**: Scans lightweight page titles, summaries, and tags to identify relevant wiki pages (using Google Gemini API reasoning via `callGemini`).
2. **Pass 2 (Content Reading)**: Fetches full Markdown article contents only for the selected pages, reducing token overhead while maintaining complete document context.

In this chapter, we:
* Build `TwoPassRetriever` with Gemini reasoning (`src/wiki/TwoPassRetriever.js`)
* Build `LLMLibrarian` with Gemini synthesis (`src/wiki/LLMLibrarian.js`)
* Implement source attribution logging

---

### 🎯 Expected Outcome

The Two-Pass Retriever uses Gemini reasoning to filter relevant pages before loading full Markdown content:

```text
Query -> Pass 1: Catalog Headers Search (Gemini Reasoning) -> Select Target Wiki Pages -> Pass 2: Read Full Article -> Gemini Synthesis
```

---

## 2. Implementing `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)

### File Path

```text
adv-vectorless-rag/src/wiki/TwoPassRetriever.js
```

### Code

```javascript
import { callGemini } from "../search/geminiClient.js";

export class TwoPassRetriever {
  constructor(wikiVault) {
    this.vault = wikiVault;
  }

  async retrieveRelevantContext(query) {
    console.log(`\n📚 [Two-Pass Retrieval] Query: "${query}"`);

    // PASS 1: Light Metadata Catalog Search
    const allHeaders = this.vault.getAllPageHeaders();
    console.log(`   ├─ Pass 1 (Catalog Search): Scanning ${allHeaders.length} page header(s)...`);

    let targetPageIds = [];

    // Try Gemini Reasoning for Pass 1 Header Selection
    const headersText = allHeaders
      .map((h) => `ID: ${h.id} | Title: ${h.title} | Tags: ${h.tags.join(", ")} | Summary: ${h.summary}`)
      .join("\n");

    const systemInstruction =
      'You are an expert Librarian AI. Evaluate the available wiki page headers against the user query ' +
      'and respond ONLY with a JSON array of selected page IDs, format: {"selectedIds": ["id1", "id2"]}';

    const prompt = `User Query: "${query}"\n\nAvailable Wiki Headers:\n${headersText}`;

    const rawResponse = await callGemini({ systemInstruction, prompt });
    if (rawResponse) {
      try {
        const cleaned = rawResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.selectedIds && Array.isArray(parsed.selectedIds)) {
          targetPageIds = parsed.selectedIds;
          console.log(`   │  └─ Gemini Pass 1 Selected ${targetPageIds.length} page(s): [${targetPageIds.join(", ")}]`);
        }
      } catch {
        // Fallback to local keyword search
      }
    }

    // Local Keyword Fallback for Pass 1
    if (targetPageIds.length === 0) {
      const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
      for (const header of allHeaders) {
        const headerText = `${header.title} ${header.summary} ${header.tags.join(" ")}`.toLowerCase();
        if (queryTerms.some((t) => headerText.includes(t))) {
          targetPageIds.push(header.id);
        }
      }
      console.log(`   │  └─ Local Fallback Pass 1 Selected ${targetPageIds.length} page(s).`);
    }

    // PASS 2: Deep Article Content Fetch
    console.log(`   └─ Pass 2 (Deep Content Fetch): Reading selected article contents...`);
    const fullArticles = [];

    for (const pageId of targetPageIds) {
      const fullPage = this.vault.getPage(pageId);
      if (fullPage) {
        fullArticles.push(fullPage);
        console.log(`      - Loaded Article: "${fullPage.title}" (${fullPage.content.length} bytes)`);
      }
    }

    return {
      query,
      pass1HeadersCount: targetPageIds.length,
      retrievedArticles: fullArticles
    };
  }
}
```

---

## 3. Implementing `LLMLibrarian` (`src/wiki/LLMLibrarian.js`)

### File Path

```text
adv-vectorless-rag/src/wiki/LLMLibrarian.js
```

### Code

```javascript
import { TwoPassRetriever } from "./TwoPassRetriever.js";
import { callGemini } from "../search/geminiClient.js";

export class LLMLibrarian {
  constructor(wikiVault) {
    this.vault = wikiVault;
    this.retriever = new TwoPassRetriever(wikiVault);
  }

  async answerQuery(query) {
    console.log(`=================================================================`);
    console.log(`📖 [LLM Librarian] Processing Request: "${query}"`);
    console.log(`=================================================================`);

    const retrievalResult = await this.retriever.retrieveRelevantContext(query);

    if (retrievalResult.retrievedArticles.length === 0) {
      return {
        query,
        answer: `I could not find any relevant wiki articles matching "${query}" in the vault.`,
        sources: []
      };
    }

    let wikiContextPayload = `=== WIKI VAULT CONTEXT ===\n\n`;
    retrievalResult.retrievedArticles.forEach((article, idx) => {
      wikiContextPayload += `--- Article ${idx + 1}: ${article.title} (Tags: ${article.tags.join(", ")}) ---\n`;
      wikiContextPayload += `${article.content}\n\n`;
    });

    // Try Gemini API Synthesis
    const systemInstruction = "You are an expert LLM Librarian. Answer the user query using the provided Wiki Vault article context accurately.";
    const prompt = `${wikiContextPayload}\nUser Query: "${query}"`;

    const geminiAnswer = await callGemini({ systemInstruction, prompt });
    const finalAnswer = geminiAnswer || `[Local Synthesis] Answer based on articles (${retrievalResult.retrievedArticles.map((a) => a.title).join(", ")}):\n\n${wikiContextPayload.slice(0, 250)}...`;

    return {
      query,
      answer: finalAnswer,
      sources: retrievalResult.retrievedArticles.map((a) => a.title)
    };
  }
}
```

---

## 4. Verification & Testing

Verify Two-Pass Retrieval in Node.js:

```bash
node -e "
import { WikiVault } from './src/wiki/WikiVault.js';
import { LLMLibrarian } from './src/wiki/LLMLibrarian.js';
const vault = new WikiVault();
vault.addPage({ id: 'page1', title: 'vLLM PagedAttention', tags: ['vllm'], summary: 'PagedAttention memory specs', content: 'PagedAttention details...' });
const librarian = new LLMLibrarian(vault);
librarian.answerQuery('vllm pagedattention').then(res => console.log('Sources Used:', res.sources));
"
```

### Expected Output

```text
[WikiVault] Indexed Wiki Page: "vLLM PagedAttention" [ID: page1]
Sources Used: [ 'vLLM PagedAttention' ]
```

Move to **Chapter 6** to build the Benchmark Engine & Multi-Mode CLI Driver.
