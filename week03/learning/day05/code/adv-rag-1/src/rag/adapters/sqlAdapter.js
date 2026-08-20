import { queryPostgres } from '../../db/postgres.js';

/**
 * Step 7 — SQL Adapter
 * Section 13: Adapts PostgreSQL query results to unified document format.
 */
export const sqlAdapter = {
  async search(query) {
    console.log(`[sqlAdapter] Searching relational database for query: "${query}"`);
    const records = await queryPostgres('SELECT * FROM accounts WHERE status = active', [query]);

    return records.map((rec, idx) => ({
      id: `sql_${rec.userId || idx}`,
      title: `Account Information (${rec.userName})`,
      text: `User Account: ${rec.userName}, Plan: ${rec.plan}, Balance: ${rec.accountBalance}, Status: ${rec.billingStatus}, Eligibility: ${rec.refundEligibility}`,
      source: 'PostgreSQL_AUTH_DB',
      metadata: {
        tenantId: 'tenant_1',
        accessLevel: 1,
        sourceType: 'SQL'
      }
    }));
  }
};
