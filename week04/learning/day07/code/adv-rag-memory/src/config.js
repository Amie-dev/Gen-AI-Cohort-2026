import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  llmProvider: process.env.LLM_PROVIDER || "openai",
  embeddingProvider: process.env.EMBEDDING_PROVIDER || "openai",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  memory: {
    mem0TopK: parseInt(process.env.MEM0_TOP_K || "3", 10),
    stmMaxTurns: parseInt(process.env.STM_MAX_TURNS || "6", 10),
  },
  rag: {
    topK: parseInt(process.env.RAG_TOP_K || "5", 10),
    rrfK: parseInt(process.env.RRF_K || "60", 10),
    cragThreshold: parseFloat(process.env.CRAG_THRESHOLD || "6.0"),
  },
};
