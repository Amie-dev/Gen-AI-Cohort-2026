/**
 * Step 9 — Document Metadata & Security Filtering
 * Section 16: Filters out documents violating tenant isolation or user permissions.
 */
export function filterResults(retrievalResultsLists, user) {
  const tenantId = user?.tenantId || 'tenant_1';
  const accessLevel = user?.accessLevel ?? 10;

  return retrievalResultsLists.map(list => {
    return list.filter(doc => {
      // 1. Tenant Isolation Check
      if (doc.metadata?.tenantId && doc.metadata.tenantId !== tenantId) {
        return false;
      }

      // 2. Role Access Level Check
      if (doc.metadata?.accessLevel && doc.metadata.accessLevel > accessLevel) {
        return false;
      }

      return true;
    });
  });
}
