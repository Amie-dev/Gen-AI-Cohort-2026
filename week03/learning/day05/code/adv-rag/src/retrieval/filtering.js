/**
 * Step 9: Filtering
 * Removes candidate documents failing tenant permissions, metadata criteria, or security ACL.
 */
export function filterResults(retrievalLists, user = {}) {
  const userTenant = user.tenantId || "default";
  const userAccess = user.accessLevel || 1;

  return retrievalLists.map((list) => {
    if (!Array.isArray(list)) return [];
    return list.filter((doc) => {
      const docTenant = doc.metadata?.tenantId || "default";
      const docAccess = doc.metadata?.accessLevel || 1;
      return docTenant === userTenant && docAccess <= userAccess;
    });
  });
}
