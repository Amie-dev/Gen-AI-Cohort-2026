# Chapter 1 — Enhanced Hierarchical Tree Data Structure (TreeNode & Index)

## 1. Chapter Goal

The goal of this chapter is to build the enhanced **`TreeNode` Model** (`src/tree/TreeNode.js`) and **`HierarchicalTreeIndex` Class** (`src/tree/HierarchicalTreeIndex.js`).

In Advanced Vectorless RAG, tree nodes are enriched with metadata tags—such as extracted **keywords** and **named entities**—alongside parent-child pointers, summaries, page ranges, and raw text chunks. This metadata enables multi-faceted reasoning during tree branch pruning.

In this chapter, we:
* Build the `TreeNode` model (`src/tree/TreeNode.js`)
* Build the `HierarchicalTreeIndex` data structure (`src/tree/HierarchicalTreeIndex.js`)
* Implement node lookup maps and tree traversals

---

### 🎯 Expected Outcome

`TreeNode` models represent structured document branches enriched with keyword and entity metadata:

```text
TreeNode [ID: sec_22]
 ├── Title: "Sticky Sessions"
 ├── Keywords: ["cookie", "session", "failover"]
 ├── Entities: ["LoadBalancer", "HTTP"]
 └── Page Range: 9-12
```

---

## 2. Implementing `TreeNode` (`src/tree/TreeNode.js`)

### File Path

```text
adv-vectorless-rag/src/tree/TreeNode.js
```

### Code

```javascript
export class TreeNode {
  constructor({
    nodeId,
    title = "",
    summary = "",
    level = 0,
    pageStart = 1,
    pageEnd = 1,
    keywords = [],
    entities = [],
    metadata = {}
  }) {
    this.nodeId = nodeId;
    this.title = title;
    this.summary = summary;
    this.level = level;
    this.pageStart = pageStart;
    this.pageEnd = pageEnd;
    this.keywords = keywords;
    this.entities = entities;
    this.metadata = metadata;
    this.parent = null;
    this.children = [];
    this.chunks = [];
  }

  addChild(childNode) {
    childNode.parent = this;
    this.children.push(childNode);
    return childNode;
  }

  addChunk(chunkText) {
    this.chunks.push(chunkText);
  }

  isLeaf() {
    return this.children.length === 0;
  }

  toJSON() {
    return {
      nodeId: this.nodeId,
      title: this.title,
      summary: this.summary,
      level: this.level,
      pageStart: this.pageStart,
      pageEnd: this.pageEnd,
      keywords: this.keywords,
      entities: this.entities,
      childrenCount: this.children.length,
      chunksCount: this.chunks.length,
      children: this.children.map((child) => child.toJSON())
    };
  }
}
```

---

## 3. Implementing `HierarchicalTreeIndex` (`src/tree/HierarchicalTreeIndex.js`)

### File Path

```text
adv-vectorless-rag/src/tree/HierarchicalTreeIndex.js
```

### Code

```javascript
export class HierarchicalTreeIndex {
  constructor(rootNode) {
    this.root = rootNode;
    this.nodeLookupMap = new Map();
    if (rootNode) {
      this._indexNode(rootNode);
    }
  }

  _indexNode(node) {
    this.nodeLookupMap.set(node.nodeId, node);
    for (const child of node.children) {
      this._indexNode(child);
    }
  }

  registerNode(node) {
    this._indexNode(node);
  }

  getNodeById(nodeId) {
    return this.nodeLookupMap.get(nodeId) || null;
  }

  traverseDFS(callback) {
    const dfs = (node) => {
      if (!node) return;
      callback(node);
      for (const child of node.children) {
        dfs(child);
      }
    };
    dfs(this.root);
  }

  traverseBFS(callback) {
    if (!this.root) return;
    const queue = [this.root];
    while (queue.length > 0) {
      const node = queue.shift();
      callback(node);
      for (const child of node.children) {
        queue.push(child);
      }
    }
  }

  getLeafNodes() {
    const leaves = [];
    this.traverseDFS((node) => {
      if (node.isLeaf()) {
        leaves.push(node);
      }
    });
    return leaves;
  }
}
```

---

## 4. Verification & Testing

Verify `TreeNode` creation and index lookup:

```bash
node -e "
import { TreeNode } from './src/tree/TreeNode.js';
import { HierarchicalTreeIndex } from './src/tree/HierarchicalTreeIndex.js';
const root = new TreeNode({ nodeId: 'root', title: 'Manual', keywords: ['system'] });
const index = new HierarchicalTreeIndex(root);
console.log('Registered Node ID:', index.getNodeById('root').nodeId);
"
```

### Expected Output

```text
Registered Node ID: root
```

Move to **Chapter 2** to build the Automatic Document Tree Builder & Keyword Extractor.
