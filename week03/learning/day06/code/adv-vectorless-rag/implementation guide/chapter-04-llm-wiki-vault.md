# Chapter 4 — LLM Wiki Architecture & Vault Manager

## 1. Chapter Goal

The goal of this chapter is to build the **`WikiVault` Class** inside `src/wiki/WikiVault.js`.

Inspired by Andrej Karpathy's LLM Wiki concept, an **LLM Wiki** organizes domain knowledge into clean, human-readable Markdown files with explicit headers, tags, and cross-reference links (`[[WikiPage]]`). Unlike black-box vector databases where knowledge is stored as floating-point arrays, an LLM Wiki vault provides transparent, inspectable knowledge pages.

In this chapter, we:
* Explore the Karpathy LLM Wiki Architecture principles
* Build the `WikiFileEntry` model and `WikiVault` class (`src/wiki/WikiVault.js`)
* Implement page header indexing and tag searches

---

### 🎯 Expected Outcome

The `WikiVault` provides a structured repository of Markdown wiki documents:

```text
WikiVault
 ├── Page 1: "vLLM Architecture" [Tags: llm, inference, memory]
 ├── Page 2: "PagedAttention Mechanism" [Tags: memory, OS, kv-cache]
 └── Page 3: "Continuous Batching" [Tags: throughput, serving]
```

---

## 2. Karpathy LLM Wiki Paradigm

```text
+-----------------------------------------------------------------------------------+
|                           KARPATHY LLM WIKI PARADIGM                              |
+-----------------------------------------------------------------------------------+
|  1. Transparent Knowledge   --> Files stored as clean Markdown documents          |
|  2. Structured Metadata    --> Headers, tags, and explicit cross-references       |
|  3. Two-Pass Retrieval     --> Light header search followed by deep section fetch  |
|  4. LLM Synthesis & Editing --> Agentic librarian updates and compiles wiki pages |
+-----------------------------------------------------------------------------------+
```

---

## 3. Implementation of `WikiVault` (`src/wiki/WikiVault.js`)

### File Path

```text
adv-vectorless-rag/src/wiki/WikiVault.js
```

### Code

```javascript
export class WikiFileEntry {
  constructor({ id, title, tags = [], summary = "", content = "" }) {
    this.id = id;
    this.title = title;
    this.tags = tags;
    this.summary = summary;
    this.content = content;
    this.updatedAt = Date.now();
  }
}

export class WikiVault {
  constructor() {
    this.pages = new Map();
  }

  addPage(pageConfig) {
    const entry = new WikiFileEntry(pageConfig);
    this.pages.set(entry.id, entry);
    console.log(`[WikiVault] Indexed Wiki Page: "${entry.title}" [ID: ${entry.id}]`);
    return entry;
  }

  getPage(id) {
    return this.pages.get(id) || null;
  }

  getAllPageHeaders() {
    const headers = [];
    for (const page of this.pages.values()) {
      headers.push({
        id: page.id,
        title: page.title,
        tags: page.tags,
        summary: page.summary
      });
    }
    return headers;
  }

  searchByTag(tag) {
    const results = [];
    const targetTag = tag.toLowerCase();
    for (const page of this.pages.values()) {
      if (page.tags.some((t) => t.toLowerCase() === targetTag)) {
        results.push(page);
      }
    }
    return results;
  }

  searchByKeyword(keyword) {
    const results = [];
    const kw = keyword.toLowerCase();
    for (const page of this.pages.values()) {
      const matchText = `${page.title} ${page.summary} ${page.tags.join(" ")}`.toLowerCase();
      if (matchText.includes(kw)) {
        results.push(page);
      }
    }
    return results;
  }
}
```

---

## 4. Verification & Testing

Verify `WikiVault` indexing and tag lookup in Node.js:

```bash
node -e "
import { WikiVault } from './src/wiki/WikiVault.js';
const vault = new WikiVault();
vault.addPage({ id: 'vllm', title: 'vLLM Architecture', tags: ['inference', 'memory'], summary: 'High performance LLM serving' });
const results = vault.searchByTag('inference');
console.log('Found Tag Matches:', results.length);
"
```

### Expected Output

```text
[WikiVault] Indexed Wiki Page: "vLLM Architecture" [ID: vllm]
Found Tag Matches: 1
```

Move to **Chapter 5** to build the Two-Pass Retriever & LLM Librarian with Gemini.
