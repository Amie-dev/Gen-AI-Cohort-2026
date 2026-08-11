import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';

async function generateVectorEmbeddingsForFile(filepath) {
  // Load the PDF content as document
  const loader = new PDFLoader(filepath);
  const document = await loader.load(); // Already chunks data page by page

  console.log(`Loaded ${document.length} pages/chunks from ${filepath}`);

  // Initialize the embedding model
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'text-embedding-004',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
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