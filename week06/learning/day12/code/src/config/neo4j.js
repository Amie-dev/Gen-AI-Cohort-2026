const neo4j = require('neo4j-driver');
require('dotenv').config();

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'password123';
const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

let driverInstance = null;
let isConnected = false;

/**
 * Initialize and get Neo4j Singleton Driver Instance
 */
function getDriver() {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      URI,
      neo4j.auth.basic(USER, PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionTimeout: 5000,
        maxTransactionRetryTime: 15000,
      }
    );
  }
  return driverInstance;
}

/**
 * Verify connectivity to Neo4j Server
 */
async function verifyConnection() {
  try {
    const driver = getDriver();
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    console.log('✅ [Neo4j] Connected successfully!');
    console.log(`   Address: ${serverInfo.address}`);
    console.log(`   Agent: ${serverInfo.agent}`);
    console.log(`   Protocol Version: ${serverInfo.protocolVersion}`);
    return { success: true, serverInfo };
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ [Neo4j] Could not connect to Neo4j database at ${URI}`);
    console.warn(`   Reason: ${error.message}`);
    console.warn('   (Make sure Docker container is running: docker compose up -d)');
    return { success: false, error: error.message };
  }
}

/**
 * Execute a parameterized Cypher query with automatic session lifecycle management
 */
async function executeQuery(cypher, params = {}, config = {}) {
  const driver = getDriver();
  try {
    const dbConfig = { database: DATABASE, ...config };
    const result = await driver.executeQuery(cypher, params, dbConfig);
    return result;
  } catch (error) {
    console.error(`❌ [Neo4j Query Error] Query execution failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get an explicit session for transactions
 */
function getSession(options = {}) {
  const driver = getDriver();
  return driver.session({ database: DATABASE, ...options });
}

/**
 * Gracefully close Neo4j driver during application shutdown
 */
async function closeDriver() {
  if (driverInstance) {
    try {
      await driverInstance.close();
      console.log('🔌 [Neo4j] Driver connection pool closed.');
    } catch (error) {
      console.error('❌ [Neo4j] Error closing driver:', error.message);
    } finally {
      driverInstance = null;
      isConnected = false;
    }
  }
}

module.exports = {
  getDriver,
  verifyConnection,
  executeQuery,
  getSession,
  closeDriver,
  URI,
  DATABASE,
};
