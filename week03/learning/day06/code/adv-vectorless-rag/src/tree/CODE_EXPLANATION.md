# 🌳 Document Tree Indexing Layer (`src/tree/`)

This component handles **PageIndex Model (Vectorless RAG)** hierarchical document tree construction, indexing, and lookup.

---

## 📂 File Map

| File Path | Purpose |
| :--- | :--- |
| [`src/tree/TreeNode.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/tree/TreeNode.js) | Data structure representing an individual node in the document hierarchy tree. |
| [`src/tree/HierarchicalTreeIndex.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/tree/HierarchicalTreeIndex.js) | Tree index manager, lineage path tracer, node lookup table (`Map`), and terminal ASCII renderer. |
| [`src/tree/TreeBuilder.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/tree/TreeBuilder.js) | Factory helper that creates a sample 3-level document hierarchy tree. |

---

## 🔬 Class & Data Structure Details

### 1. `TreeNode.js`
Each node represents a document element (Root, Chapter, Section).

* **Properties**: `nodeId`, `title`, `level`, `pageRange`, `summary`, `keywords`, `entities`, `children`, `parent`, `content`.
* **Lazy Loading**: `content` remains `null` for internal/chapter nodes and is loaded only when reaching a leaf node (`children.length === 0`).
* **`addChild(childNode)`**: Links parent pointer (`childNode.parent = this`) and pushes child to `this.children`.
* **`toMetadataJSON()`**: Exports lightweight node metadata **without bloating prompt memory** with raw text.

---

### 2. `HierarchicalTreeIndex.js`
* **Lookup Map (`indexMap`)**: Stores `nodeId -> TreeNode` mapping for $O(1)$ fast lookup.
* **`getLineagePath(nodeId)`**: Walks up parent pointers from target node to root, assembling the explicit path (e.g. `root -> ch_2 -> sec_2_2`).
* **`printTree()`**: Renders visual ASCII tree structure in terminal output.

---

### 3. `TreeBuilder.js`
Builds a sample technical manual document tree:
```text
[root] Distributed Systems Architecture Manual v2.0 (pp. 1-500)
 ├── [ch_1] Chapter 1: Networking & Edge Routing Architecture (pp. 1-120)
 ├── [ch_2] Chapter 2: Load Balancing & Traffic Distribution (pp. 121-250)
 │    ├── [sec_2_1] Section 2.1: CDN Edge Static Asset Caching (pp. 121-160)
 │    └── [sec_2_2] Section 2.2: Session Persistence & Sticky Sessions (pp. 161-250)
 └── [ch_3] Chapter 3: Distributed Database Replication (pp. 251-500)
```
