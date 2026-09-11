const queryProfilerService = require('../services/queryProfilerService');

async function runProfilingDemo() {
  console.log('===============================================================');
  console.log('  📊 DEMO 06 — QUERY PROFILING WITH EXPLAIN & PROFILE');
  console.log('===============================================================\n');

  try {
    const userName = 'Alice';
    console.log(`1️⃣ Running Performance Comparison for Query filtering on User "${userName}"...`);
    
    const performance = await queryProfilerService.compareQueryPerformance(userName);

    console.log('\n🔍 EXPLAIN Output (Query Plan):');
    console.log(`   Operator: ${performance.explain.operatorType}`);
    console.log(`   Summary: ${performance.explain.summaryText}`);

    console.log('\n⚡ PROFILE Output (Runtime Statistics):');
    console.log(`   Execution Time: ${performance.profile.executionTimeMs} ms`);
    console.log(`   Database Hits (dbHits): ${performance.profile.dbHits}`);
    console.log(`   Records Returned: ${performance.profile.recordsRetrieved}`);
    console.log(`   Summary: ${performance.profile.summaryText}`);

  } catch (error) {
    console.error('❌ Demo 06 Error:', error.message);
  }
  console.log('===============================================================\n');
}

module.exports = { runProfilingDemo };

if (require.main === module) {
  runProfilingDemo().then(() => process.exit(0));
}
