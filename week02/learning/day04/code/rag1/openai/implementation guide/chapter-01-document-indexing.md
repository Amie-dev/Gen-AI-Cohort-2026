# Chapter 01 — Document Ingestion & Qdrant Indexing

## 1. Chapter Goal

This chapter details the ingestion workflow that parses local PDF files (`dsa.pdf`), converts document pages into dense vector representations using OpenAI's `text-embedding-3-small` model, and indexes the resulting document vectors into Qdrant.

---

## 2. Ingestion Pipeline Workflow

```text
Local PDF File (dsa.pdf)
       │
       ▼
PDFLoader (@langchain/community)
       │ (Parses PDF into Document objects per page)
       ▼
OpenAIEmbeddings (text-embedding-3-small)
       │ (Generates vector embeddings)
       ▼
QdrantVectorStore (chaicode-docs collection)
       │ (Stores vectors + metadata)
       ▼
Indexing Complete Confirmation
```

### Key Components

1. **PDFLoader**: Extracts text and metadata page by page from local PDF files.
2. **OpenAIEmbeddings**: Uses `text-embedding-3-small` to transform page text into high-dimensional vector representations.
3. **QdrantVectorStore**: Interacts with the `chaicode-docs` collection hosted on Qdrant (`http://localhost:6333`) and inserts document vectors along with metadata.

---

## 3. Complete Verbatim Source Code (`indexing.js`)

Source file: [`indexing.js`](file:///home/aminul/development/gen-ai-cohort/week02/learning/day04/code/rag1/openai/indexing.js)

```javascript
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

async function generateVectorEmbeddingsForFile(filepath) {
  // Load the PDF content as document
  const loader = new PDFLoader(filepath);
  const document = await loader.load(); // Already chunks data page by page
  console.log(`Loaded ${document.length} pages/chunks from ${filepath}`);

  // Initialize the embedding model
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  });

  // The vector store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings, // Use this embedding model
    {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'chaicode-docs',
    },
  );

  await vectorStore.addDocuments(document);
  console.log(`All the documents are indexed into Qdrant successfully.`);
}

generateVectorEmbeddingsForFile('dsa.pdf');
```

---

## 4. Execution Command

Run the document indexing script:

```bash
node indexing.js
```

### Expected Output

```text
Loaded 45 pages/chunks from dsa.pdf
All the documents are indexed into Qdrant successfully.
```
