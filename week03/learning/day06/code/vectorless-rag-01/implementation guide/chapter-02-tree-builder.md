# Chapter 2 — Automatic Document Tree Builder & Parser

## 1. Chapter Goal

The goal of this chapter is to build the **`TreeBuilder` Class** inside `src/tree/TreeBuilder.js`.

Manually building tree nodes for large technical manuals is impractical. The `TreeBuilder` automatically parses raw structured text (such as Markdown documents with `#`, `##`, and `###` headers), generates parent-child relationships, calculates page ranges, generates node summaries, and returns a fully initialized `HierarchicalTreeIndex`.

In this chapter, we:
* Build the `TreeBuilder` class (`src/tree/TreeBuilder.js`)
* Implement header-based hierarchy parsing
* Implement automatic node summary generation

---

### 🎯 Expected Outcome

Raw text documents are automatically converted into a structured `HierarchicalTreeIndex`:

```text
Raw Markdown Text ──> TreeBuilder.buildFromMarkdown() ──> HierarchicalTreeIndex
```

---

## 2. Implementation of `TreeBuilder` (`src/tree/TreeBuilder.js`)

### File Path

```text
vectorless-rag-01/src/tree/TreeBuilder.js
```

### Code

```javascript
import { TreeNode } from "./TreeNode.js";
import { HierarchicalTreeIndex } from "./HierarchicalTreeIndex.js";

export class TreeBuilder {
  static buildFromStructuredSections(docTitle, sections) {
    const root = new TreeNode({
      id: "root",
      title: docTitle,
      summary: `Root document node for ${docTitle}`,
      level: 0,
      pageStart: 1,
      pageEnd: 1
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

      const summary = section.summary || TreeBuilder._generateSummary(section.title, section.content);

      const node = new TreeNode({
        id: nodeId,
        title: section.title,
        summary,
        level,
        pageStart,
        pageEnd,
        metadata: section.metadata || {}
      });

      if (section.content) {
        node.addChunk(section.content);
      }

      // Pop stack until finding the parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parentNode = stack[stack.length - 1].node;
      parentNode.addChild(node);
      stack.push({ level, node });
    }

    // Recalculate parent page ranges and summaries
    TreeBuilder._postProcessNode(root);

    return new HierarchicalTreeIndex(root);
  }

  static _generateSummary(title, content = "") {
    const cleanContent = content.replace(/\n+/g, " ").trim();
    if (!cleanContent) {
      return `Section focusing on ${title}`;
    }
    const snippet = cleanContent.length > 120 ? cleanContent.slice(0, 120) + "..." : cleanContent;
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

    if (!node.summary || node.summary.startsWith("Root document node")) {
      const childTitles = node.children.map((c) => c.title).join(", ");
      node.summary = `Container node '${node.title}' covering pages ${minPage}-${maxPage}. Sub-sections: ${childTitles}`;
    }
  }
}
```

---

## 3. Deep Dive into Tree Parsing Logic

### 1. Stack-Based Parent Matching

`buildFromStructuredSections` uses a stack `[{ level, node }]` to maintain active heading depth. When encountering a Level 2 header (`##`), it pops Level 2 and Level 3 headers off the stack until finding the parent Level 1 header (`#`).

### 2. Post-Process Page Range & Summary Calculation

`_postProcessNode(node)` performs a bottom-up post-order traversal to calculate `pageStart` and `pageEnd` bounds for parent container nodes based on their child leaves.

---

## 4. Verification & Testing

Verify automatic tree building in Node.js:

```bash
node -e "
import { TreeBuilder } from './src/tree/TreeBuilder.js';
const sections = [
  { title: 'Networking', level: 1, content: 'Network protocols' },
  { title: 'Load Balancing', level: 1, content: 'Load balancing algorithms' },
  { title: 'Sticky Sessions', level: 2, content: 'Cookie session failover' }
];
const index = TreeBuilder.buildFromStructuredSections('System Manual', sections);
console.log('Tree Index Root Title:', index.root.title);
console.log('Children Count:', index.root.children.length);
"
```

### Expected Output

```text
Tree Index Root Title: System Manual
Children Count: 2
```

Move to **Chapter 3** to build the Summary Pruner and Agentic Tree Search Engine.
