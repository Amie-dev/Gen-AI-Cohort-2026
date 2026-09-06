# Chapter 02 — Vector Retrieval & Grounded Question Answering

## 1. Chapter Goal

This chapter details the query and generation workflow (`query.js`). It demonstrates how to perform semantic search against Qdrant, construct a strict grounded system prompt with page numbers and document metadata, and invoke OpenAI `gpt-4o` for accurate, zero-hallucination answers.

---

## 2. Retrieval & Grounded Generation Pipeline

```text
User Question ("what is black box testing?")
       │
       ▼
OpenAIEmbeddings (text-embedding-3-small)
       │
       ▼
QdrantVectorStore Retriever (k: 5 top chunks)
       │
       ▼
Format Context & Metadata (bookName, pageContent, pageNumber)
       │
       ▼
Grounded System Prompt Construction
       │
       ▼
OpenAI Chat Completion (gpt-4o)
       │
       ▼
Grounded Response Output
```

### Key Technical Mechanisms

1. **Retriever Construction**: Converts `QdrantVectorStore` to a retriever interface configured with top-5 nearest neighbors (`k: 5`).
2. **Context Formatting**: Maps retrieved chunks to structured JSON string representations including `bookName`, `pageContent`, and `pageNumber` extracted from `e.metadata.loc?.pageNumber`.
3. **Strict Grounding System Prompt**: Mandates that the LLM only answers based on provided documents and requires citation of book name and page number.

---

## 3. Complete Verbatim Source Code (`query.js`)

Source file: [`query.js`](file:///home/aminul/development/gen-ai-cohort/week02/learning/day04/code/rag1/openai/query.js)

```javascript
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function query(userQuery) {
  // Convert user query to vector embeddings
  // Initialize the embedding model
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Search the vectors in Qdrant
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'chaicode-docs',
    },
  );

  // Retrieve top relevant chunks
  const vectorRetriever = vectorStore.asRetriever({ k: 5 });
  const results = await vectorRetriever.invoke(userQuery);

  // Feed retrieved chunks into system prompt for grounded LLM answer
  const SYSTEM_PROMPT = `
You are an expert in answering user questions based strictly on the provided context.
Do not answer anything beyond what is provided in the documents.

Always answer the user concisely and include the page number and name of the document/book.

User Documents:
${results.map((e) => JSON.stringify({ bookName: e.metadata.source, pageContent: e.pageContent, pageNumber: e.metadata.loc?.pageNumber })).join('\n\n')}
  `;

  console.log('--- SYSTEM PROMPT CREATED ---');
  console.log(SYSTEM_PROMPT);

  const llmResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ],
  });

  console.log('\n--- LLM GROUNDED RESPONSE ---');
  console.log(llmResponse.choices[0].message.content);
}

query('what is black box testing?');
```

---

## 4. Execution Command

Run the query pipeline:

```bash
node query.js
```

### Sample Output Log

```text
--- SYSTEM PROMPT CREATED ---

You are an expert in answering user questions based strictly on the provided context.
Do not answer anything beyond what is provided in the documents.

Always answer the user concisely and include the page number and name of the document/book.

User Documents:
{"bookName":"dsa.pdf","pageContent":"Black box testing is a software testing method...","pageNumber":14}

...


--- LLM GROUNDED RESPONSE ---
Black box testing is a software testing method where the internal structure or design of the item being tested is not known to the tester (Page 14, dsa.pdf).
```
