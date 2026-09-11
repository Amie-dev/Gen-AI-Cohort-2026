const cognitiveMemoryService = require('../services/cognitiveMemoryService');

async function runAgentMemoryDemo() {
  console.log('===============================================================');
  console.log('  🧠 DEMO 04 — COGNITIVE & AI AGENT MEMORY ARCHITECTURE');
  console.log('===============================================================\n');

  try {
    const userId = 'usr_alice';

    // 1. Store Factual Memory
    console.log('1️⃣ [Factual Memory] Storing long-term factual memory for Alice...');
    const fact = await cognitiveMemoryService.storeFactualMemory(
      userId,
      'Alice works on GraphRAG and prefers Neo4j vector search with cosine distance',
      0.99
    );
    console.log('   Stored Factual Memory:', fact);

    // 2. Store Episodic Memory
    console.log('\n2️⃣ [Episodic Memory] Storing recent interaction event in Session #201...');
    const episode = await cognitiveMemoryService.storeEpisodicMemory(
      userId,
      'User requested code demonstration for Cypher performance profiling',
      'sess_201',
      'GraphRAG'
    );
    console.log('   Stored Episodic Memory:', episode);

    // 3. Retrieve Active Memories with Temporal Decay
    console.log('\n3️⃣ [Memory Retrieval & Time Decay] Querying active weighted memories...');
    const activeMemories = await cognitiveMemoryService.retrieveActiveMemories(userId, 5);
    console.table(activeMemories);

    // 4. Construct AI Agent Context
    console.log('\n4️⃣ [AI Context Synthesis] Building structured prompt context from Knowledge Graph...');
    const context = await cognitiveMemoryService.buildAgentContextForUser(userId);
    console.log('   Synthesized AI Context Profile:\n', JSON.stringify(context, null, 2));
  } catch (error) {
    console.error('❌ Demo 04 Error:', error.message);
  }
  console.log('===============================================================\n');
}

module.exports = { runAgentMemoryDemo };

if (require.main === module) {
  runAgentMemoryDemo().then(() => process.exit(0));
}
