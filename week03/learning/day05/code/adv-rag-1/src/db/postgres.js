import dotenv from 'dotenv';
dotenv.config();

/**
 * PostgreSQL Data Access Client
 * Handles relational queries for auth, account balances, and billing plans.
 */
export async function queryPostgres(sql, params = []) {
  console.log(`[PostgreSQL DB] Executing query: ${sql}`, params);

  // Return realistic mock data for account/billing queries
  if (sql.toLowerCase().includes('account') || sql.toLowerCase().includes('plan')) {
    return [
      {
        userId: 'usr_123',
        userName: 'John Doe',
        plan: 'Enterprise Pro',
        billingStatus: 'Active',
        accountBalance: '$250.00',
        refundEligibility: 'Eligible within 30 days of renewal',
        lastPaymentDate: '2026-08-01'
      }
    ];
  }

  return [];
}
