const graphRagService = require('../services/graphRagService');

async function runGraphRagDemo() {
  console.log('===============================================================');
  console.log('  🤖 DEMO 05 — GRAPHRAG & TEXT-TO-CYPHER SAFETY VALIDATION');
  console.log('===============================================================\n');

  try {
    // 1. GraphRAG Hybrid Retrieval
    console.log('1️⃣ [GraphRAG Retrieval] Retrieving document chunks + explicit graph relationships for query: "GraphRAG"...');
    const ragContext = await graphRagService.retrieveGraphRagContext('GraphRAG', 2);
    console.log('   GraphRAG Retrieved Context:', JSON.stringify(ragContext, null, 2));

    // 2. Text-to-Cypher Prompt
    console.log('\n2️⃣ [Text-to-Cypher Prompt Generator] Constructing prompt for natural language query...');
    const userQuery = 'Find all hotels in Paris liked by Alice with a rating above 4.5';
    const prompt = graphRagService.buildTextToCypherPrompt(userQuery);
    console.log('   Generated LLM Prompt Preview:\n', prompt.trim().split('\n').slice(0, 10).join('\n') + '\n   ...');

    // 3. Safety Validator Tests
    console.log('\n3️⃣ [Cypher Injection & Safety Validator]');
    
    const validQuery = 'MATCH (u:User {name: $userName})-[:LIKES]->(h:Hotel) RETURN u, h';
    const maliciousQuery = 'MATCH (u:User) DETACH DELETE u';
    const invalidStartQuery = 'CREATE (u:User {name: "Attacker"}) RETURN u';

    console.log('   Testing Valid Query:', graphRagService.validateCypherSafety(validQuery));
    console.log('   Testing Malicious Query (DETACH DELETE):', graphRagService.validateCypherSafety(maliciousQuery));
    console.log('   Testing Invalid Start Query (CREATE):', graphRagService.validateCypherSafety(invalidStartQuery));

    // 4. Execute Safe Query
    console.log('\n4️⃣ [Executing Validated Query]');
    const safeResults = await graphRagService.executeSafeTextToCypher(
      'MATCH (u:User {name: $name})-[:LIKES]->(h:Hotel) RETURN u.name AS user, h.businessName AS hotel, h.rating AS rating',
      { name: 'Alice' }
    );
    console.table(safeResults);

  } catch (error) {
    console.error('❌ Demo 05 Error:', error.message);
  }
  console.log('===============================================================\n');
}

module.exports = { runGraphRagDemo };

if (require.main === module) {
  runGraphRagDemo().then(() => process.exit(0));
}
