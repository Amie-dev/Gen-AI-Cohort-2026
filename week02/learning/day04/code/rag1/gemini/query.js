import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
});

async function query(userQuery) {
  // Initialize Gemini Embedding model
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'text-embedding-004',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  });

  // Connect to Qdrant vector store
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

  const contextText = results
    .map(
      (e) =>
        `[Source: ${e.metadata.source}, Page: ${e.metadata.loc?.pageNumber}]\nContent: ${e.pageContent}`
    )
    .join('\n\n---\n\n');

  const prompt = `You are a helpful assistant answering user queries strictly based on the provided documents.
Do not make up facts or answer beyond the provided context.

User Documents:
${contextText}

Question: ${userQuery}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  console.log('--- RETRIEVED CHUNKS ---');
  console.log(contextText);
  console.log('\n--- GEMINI GROUNDED RESPONSE ---');
  console.log(response.text);
}

query('what is black box testing?');
