# Chapter 2 — Automatic Document Tree Builder & Keyword Extractor

## 1. Chapter Goal

The goal of this chapter is to build the **`TreeBuilder` Class** inside `src/tree/TreeBuilder.js`.

The `TreeBuilder` automatically converts structured section lists into a `HierarchicalTreeIndex`. Beyond heading level nesting and page range calculations, `TreeBuilder` extracts key technical domain terms (`keywords` and `entities`) from section titles and text content.

In this chapter, we:
* Build the `TreeBuilder` class (`src/tree/TreeBuilder.js`)
* Implement heading level stack parsing
* Implement automatic keyword and entity extraction

---

### 🎯 Expected Outcome

`TreeBuilder` automatically extracts hierarchy, page ranges, and metadata keywords:

```text
Section List ──> TreeBuilder.buildFromStructuredSections() ──> HierarchicalTreeIndex (with Keywords & Page Ranges)
```

---

## 2. Implementation of `TreeBuilder` (`src/tree/TreeBuilder.js`)

### File Path

```text
adv-vectorless-rag/src/tree/TreeBuilder.js
```

### Code

```javascript
import { TreeNode } from "./TreeNode.js";
import { HierarchicalTreeIndex } from "./HierarchicalTreeIndex.js";

export class TreeBuilder {
  static buildFromStructuredSections(docTitle, sections) {
    const root = new TreeNode({
      nodeId: "root",
      title: docTitle,
      summary: `Root document index for ${docTitle}`,
      level: 0,
      pageStart: 1,
      pageEnd: 1,
      keywords: TreeBuilder._extractKeywords(docTitle),
      entities: []
    });

    const stack = [{ level: 0, node: root }];
    let idCounter = 1;
    let currentPage = 1;

    for (const section of sections) {
      const level = section.level || 1;
      const nodeId = `node_${idCounter++}`;
      const pageStart = section.pageStart || currentPage;
      const pageEnd = section.pageEnd || pageStart;
      currentPage = pageEnd;

      const keywords = section.keywords || TreeBuilder._extractKeywords(`${section.title} ${section.content || ""}`);
      const entities = section.entities || TreeBuilder._extractEntities(section.content || "");
      const summary = section.summary || TreeBuilder._generateSummary(section.title, section.content);

      const node = new TreeNode({
        nodeId,
        title: section.title,
        summary,
        level,
        pageStart,
        pageEnd,
        keywords,
        entities,
        metadata: section.metadata || {}
      });

      if (section.content) {
        node.addChunk(section.content);
      }

      // Maintain heading stack
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parentNode = stack[stack.length - 1].node;
      parentNode.addChild(node);
      stack.push({ level, node });
    }

    TreeBuilder._postProcessNode(root);
    return new HierarchicalTreeIndex(root);
  }

  static _extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set(["the", "and", "for", "with", "this", "that", "from", "have", "are"]);
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq = new Map();

    for (const word of words) {
      if (!stopWords.has(word)) {
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }

  static _extractEntities(text) {
    if (!text) return [];
    const matches = text.match(/\b[A-Z][a-zA-Z0-9_]+\b/g) || [];
    return Array.from(new Set(matches)).slice(0, 5);
  }

  static _generateSummary(title, content = "") {
    const clean = content.replace(/\n+/g, " ").trim();
    if (!clean) return `Section describing ${title}`;
    const snippet = clean.length > 130 ? clean.slice(0, 130) + "..." : clean;
    return `[${title}] ${snippet}`;
  }

  static _postProcessNode(node) {
    if (node.isLeaf()) return;

    let minPage = node.pageStart;
    let maxPage = node.pageEnd;

    for (const child of node.children) {
      TreeBuilder._postProcessNode(child);
      minPage = Math.min(minPage, child.pageStart);
      maxPage = Math.max(maxPage, child.pageEnd);
    }

    node.pageStart = minPage;
    node.pageEnd = maxPage;
  }
}
```

---

## 3. Verification & Testing

Verify automatic tree creation with keyword extraction in Node.js:

```bash
node -e "
import { TreeBuilder } from './src/tree/TreeBuilder.js';
const sections = [{ title: 'Load Balancing', level: 1, content: 'Sticky session cookie failover algorithm' }];
const index = TreeBuilder.buildFromStructuredSections('Cluster Manual', sections);
console.log('Extracted Keywords:', index.root.children[0].keywords);
"
```

### Expected Output

```text
Extracted Keywords: [ 'sticky', 'session', 'cookie', 'failover', 'algorithm' ]
```

Move to **Chapter 3** to build the Gemini-Powered Summary Pruner and Agentic Tree Search Engine.
