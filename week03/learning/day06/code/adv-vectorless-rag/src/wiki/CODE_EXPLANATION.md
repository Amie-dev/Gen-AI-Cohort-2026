# 📚 LLM Wiki Architecture Layer (`src/wiki/`)

This component implements **Andrej Karpathy's LLM Wiki Architecture** using human-readable Markdown files and two-pass retrieval scanning.

---

## 📂 File Map

| File Path | Description |
| :--- | :--- |
| [`src/wiki/WikiVault.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/wiki/WikiVault.js) | `WikiFileEntry` data structure and `WikiVault` catalog container. |
| [`src/wiki/LLMLibrarian.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/wiki/LLMLibrarian.js) | Factory populating sample Markdown vault notes (`alb-sticky-sessions.md`, `cdn-setup.md`, `postgres-replication.md`). |
| [`src/wiki/TwoPassRetriever.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day06/code/adv-vectorless-rag/src/wiki/TwoPassRetriever.js) | Karpathy Two-Pass retrieval algorithm with Gemini AI catalog evaluation and local keyword fallback. |

---

## 🔬 How Two-Pass Retrieval Works

```text
User Query
  ↓
TwoPassRetriever.searchAndRetrieve()
  ↓
PASS 1: catalog = WikiVault.listCatalogMetadata() (0% raw text loaded)
  ├── Try evaluateCatalogWithGemini(query, catalog)
  └── Fallback to local keyword match scoring
  ↓
Target File Selected (e.g. 'vault/infrastructure/alb-sticky-sessions.md')
  ↓
PASS 2: rawContent = WikiVault.readFileContent(selectedFilePath)
  ↓
Return full text of selected Markdown note
```
