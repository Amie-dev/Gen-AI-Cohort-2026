/**
 * Relational DB Adapter Mock / Implementation (PostgreSQL)
 * Serves structured user account, subscription, and billing data.
 */
export async function queryPostgres(sqlQuery, params = []) {
  console.log(`🛢️ [PostgreSQL] Executing Query: "${sqlQuery}"`);
  
  // Mock relational records for production simulation
  const mockDatabase = [
    { id: "USER_123", name: "John Doe", plan: "Pro Tier", billingStatus: "Active", monthlyFee: "$29.99", lastInvoiceDate: "2026-08-01", refundEligible: true },
    { id: "USER_456", name: "Jane Smith", plan: "Enterprise", billingStatus: "Active", monthlyFee: "$299.00", lastInvoiceDate: "2026-08-05", refundEligible: true },
    { id: "USER_789", name: "Bob Johnson", plan: "Free Tier", billingStatus: "Inactive", monthlyFee: "$0.00", lastInvoiceDate: "N/A", refundEligible: false },
  ];

  return mockDatabase;
}
