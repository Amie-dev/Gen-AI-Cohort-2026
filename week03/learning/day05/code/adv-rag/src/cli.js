import { productionRAG } from "./rag/ragPipeline.js";

async function main() {
  const args = process.argv.slice(2);
  const query = args[0] || "What is my current account balance and refund policy?";

  console.log(`⚡ Production Advanced RAG Console CLI ⚡\n`);
  console.log(`User Query: "${query}"\n`);

  const user = { id: "USER_123", tenantId: "default", accessLevel: 1 };
  const result = await productionRAG(query, user);

  console.log(`\n==================================================`);
  console.log(`🎯 FINAL ANSWER RESULT:`);
  console.log(`==================================================\n`);
  console.log(result.answer);
  console.log(`\n--------------------------------------------------`);
  console.log(`Quality Score: ${result.score}/10 | Success: ${result.success}`);
  console.log(`Sources Used:`, result.sources);
  console.log(`--------------------------------------------------\n`);
}

main();
