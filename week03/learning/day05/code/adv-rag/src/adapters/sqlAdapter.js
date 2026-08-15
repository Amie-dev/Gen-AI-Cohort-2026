import { queryPostgres } from "../db/postgres.js";

/**
 * SQL DB Adapter
 */
export async function searchSQL(query, user = {}) {
  const records = await queryPostgres(query);
  const targetUser = records.find(r => r.id === user.id || r.id === "USER_123") || records[0];

  return [
    {
      id: `sql_${targetUser.id}`,
      title: `Relational User Account Record (${targetUser.id})`,
      text: `User Account: ${targetUser.name} (${targetUser.id})\nPlan: ${targetUser.plan}\nBilling Status: ${targetUser.billingStatus}\nMonthly Fee: ${targetUser.monthlyFee}\nRefund Eligible: ${targetUser.refundEligible}`,
      source: "PostgreSQL Database",
      score: 0.98,
      metadata: { tenantId: user.tenantId || "default", accessLevel: 1 }
    }
  ];
}
