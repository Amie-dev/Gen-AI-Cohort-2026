# Chapter 5 — Two-Pass Retrieval & LLM Librarian

## 1. Chapter Goal

The goal of this chapter is to build the **`TwoPassRetriever` Class** (`src/wiki/TwoPassRetriever.js`) and the **`LLMLibrarian` Class** (`src/wiki/LLMLibrarian.js`).

Standard RAG sends full document chunks directly into embedding models. The **LLM Wiki Two-Pass Paradigm** mimics how a human librarian searches a library:
1. **Pass 1 (Catalog Search)**: Scans lightweight page titles, summaries, and tags to identify relevant wiki pages.
2. **Pass 2 (Content Reading)**: Fetches full Markdown article contents only for the selected pages, reducing token overhead while maintaining complete document context.

In this chapter, we:
* Build `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)
* Build `LLMLibrarian` (`src/wiki/LLMLibrarian.js`)
* Implement two-pass wiki search and answer synthesis

---

### 🎯 Expected Outcome

The Two-Pass Retriever filters relevant pages before loading full Markdown content:

```text
Query -> Pass 1: Catalog Headers Search -> Select Target Wiki Pages -> Pass 2: Read Full Article -> Answer Synthesis
```

---

## 2. Implementing `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)

### File Path

```text
vectorless-rag-01/src/wiki/TwoPassRetriever.js
```

### Code

```javascript
export class TwoPassRetriever {
  constructor(wikiVault) {
    this.vault = wikiVault;
  }

  retrieveRelevantContext(query) {
    console.log(`\n📚 [Two-Pass Retrieval] Query: "${query}"`);

    // PASS 1: Light Metadata Catalog Search
    const allHeaders = this.vault.getAllPageHeaders();
    console.log(`   ├─ Pass 1 (Catalog Search): Scanning ${allHeaders.length} page header(s)...`);

    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const matchedHeaders = [];

    for (const header of allHeaders) {
      const headerText = `${header.title} ${header.summary} ${header.tags.join(" ")}`.toLowerCase();
      let matchScore = 0;
      for (const term of queryTerms) {
        if (headerText.includes(term)) {
          matchScore++;
        }
      }
      if (matchScore > 0) {
        matchedHeaders.push({ ...header, matchScore });
      }
    }

    matchedHeaders.sort((a, b) => b.matchScore - a.matchScore);
    console.log(`   │  └─ Pass 1 Match: Identified ${matchedHeaders.length} relevant wiki page(s).`);

    // PASS 2: Deep Article Content Fetch
    console.log(`   └─ Pass 2 (Deep Content Fetch): Reading selected article contents...`);
    const fullArticles = [];

    for (const header of matchedHeaders) {
      const fullPage = this.vault.getPage(header.id);
      if (fullPage) {
        fullArticles.push(fullPage);
        console.log(`      - Loaded Article: "${fullPage.title}" (${fullPage.content.length} bytes)`);
      }
    }

    return {
      query,
      pass1HeadersCount: matchedHeaders.length,
      retrievedArticles: fullArticles
    };
  }
}
```

---

## 3. Implementing `LLMLibrarian` (`src/wiki/LLMLibrarian.js`)

### File Path

```text
vectorless-rag-01/src/wiki/LLMLibrarian.js
```

### Code

```javascript
import { TwoPassRetriever } from "./TwoPassRetriever.js";

export class LLMLibrarian {
  constructor(wikiVault) {
    this.vault = wikiVault;
    this.retriever = new TwoPassRetriever(wikiVault);
  }

  answerQuery(query) {
    console.log(`=================================================================`);
    console.log(`📖 [LLM Librarian] Processing Request: "${query}"`);
    console.log(`=================================================================`);

    const retrievalResult = this.retriever.retrieveRelevantContext(query);

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

    const answer = `Based on the LLM Wiki Vault articles (${retrievalResult.retrievedArticles.map((a) => a.title).join(", ")}), here is the answer to your query:\n\n${wikiContextPayload.slice(0, 300)}...`;

    return {
      query,
      answer,
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
const res = librarian.answerQuery('vllm pagedattention');
console.log('Sources Used:', res.sources);
"
```

### Expected Output

```text
[WikiVault] Indexed Wiki Page: "vLLM PagedAttention" [ID: page1]
Sources Used: [ 'vLLM PagedAttention' ]
```

Move to **Chapter 6** to build the Benchmark Engine & Multi-Mode CLI Driver.
