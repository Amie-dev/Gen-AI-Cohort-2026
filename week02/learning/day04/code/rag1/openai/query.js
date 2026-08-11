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