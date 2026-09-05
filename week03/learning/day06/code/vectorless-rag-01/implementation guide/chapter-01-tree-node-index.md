# Chapter 1 — Hierarchical Tree Data Structure (TreeNode & Index)

## 1. Chapter Goal

The goal of this chapter is to build the core tree data structures inside `src/tree/`: **`TreeNode`** (`TreeNode.js`) and **`HierarchicalTreeIndex`** (`HierarchicalTreeIndex.js`).

Traditional RAG flattens documents into a single collection of unorganized text chunks. Vectorless RAG models documents as a **Hierarchical Tree Index (PageIndex Model)**. Each node represents a structural unit (Document, Chapter, Section, Subsection, Page) maintaining explicit parent-child pointers, summaries, page ranges, and leaf content chunks.

In this chapter, we:
* Build the `TreeNode` model (`src/tree/TreeNode.js`)
* Build the `HierarchicalTreeIndex` data structure (`src/tree/HierarchicalTreeIndex.js`)
* Implement Depth-First (DFS) and Breadth-First (BFS) tree traversals

---

### 🎯 Expected Outcome

The tree data structures allow representing structured document hierarchies in memory:

```text
TreeNode (Root)
 ├── TreeNode (Chapter 1)
 └── TreeNode (Chapter 2)
      ├── TreeNode (Section 2.1)
      └── TreeNode (Section 2.2) --> Leaf Chunks [Page 14-16]
```

---

## 2. Implementing `TreeNode` (`src/tree/TreeNode.js`)

### File Path

```text
vectorless-rag-01/src/tree/TreeNode.js
```

### Code

```javascript
export class TreeNode {
  constructor({
    id,
    title = "",
    summary = "",
    level = 0,
    pageStart = 1,
    pageEnd = 1,
    metadata = {}
  }) {
    this.id = id;
    this.title = title;
    this.summary = summary;
    this.level = level;
    this.pageStart = pageStart;
    this.pageEnd = pageEnd;
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
      id: this.id,
      title: this.title,
      summary: this.summary,
      level: this.level,
      pageStart: this.pageStart,
      pageEnd: this.pageEnd,
      metadata: this.metadata,
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
vectorless-rag-01/src/tree/HierarchicalTreeIndex.js
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
    this.nodeLookupMap.set(node.id, node);
    for (const child of node.children) {
      this._indexNode(child);
    }
  }

  registerNode(node) {
    this._indexNode(node);
  }

  getNodeById(id) {
    return this.nodeLookupMap.get(id) || null;
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

  toJSON() {
    return this.root ? this.root.toJSON() : null;
  }
}
```

---

## 4. Verification & Testing

Verify tree construction and DFS traversal in Node.js:

```bash
node -e "
import { TreeNode } from './src/tree/TreeNode.js';
import { HierarchicalTreeIndex } from './src/tree/HierarchicalTreeIndex.js';
const root = new TreeNode({ id: 'root', title: 'Manual' });
const ch1 = root.addChild(new TreeNode({ id: 'ch1', title: 'Chapter 1' }));
const index = new HierarchicalTreeIndex(root);
console.log('Indexed Nodes Count:', index.nodeLookupMap.size);
"
```

### Expected Output

```text
Indexed Nodes Count: 2
```

Move to **Chapter 2** to build the Automated Document Tree Builder.
