import { WikiFileEntry, WikiVault } from "./WikiVault.js";

/**
 * LLMLibrarian simulates a background AI librarian building human-readable knowledge vault notes.
 */
export class LLMLibrarian {
  /**
   * Factory function populating a sample WikiVault with Markdown files.
   * @returns {WikiVault}
   */
  static buildSampleWikiVault() {
    const vault = new WikiVault();

    vault.addFileEntry(
      new WikiFileEntry({
        filePath: "vault/infrastructure/alb-sticky-sessions.md",
        title: "Application Load Balancer (ALB) Sticky Sessions & Cookies",
        category: "Infrastructure & Networking",
        tags: ["alb", "sticky sessions", "awsalb cookie", "session persistence", "load balancing"],
        summary: "Explains AWS Application Load Balancer cookie injection (AWSALB), sticky session routing, and Redis failover re-hydration.",
        content: `# ALB Sticky Sessions Architecture Guide

When sticky sessions are enabled on the AWS Application Load Balancer (ALB),
the load balancer binds a user's session state to a specific backend EC2 target instance.

Key Cookie: AWSALB (Encrypted, 7-day default lifespan)
Failover Behavior: If sticky target instance drops out of target group due to 3 failed health checks,
the ALB assigns a new sticky node and updates the browser cookie. Session state is re-hydrated from Redis.`
      })
    );

    vault.addFileEntry(
      new WikiFileEntry({
        filePath: "vault/infrastructure/cdn-setup.md",
        title: "CDN Edge Asset Caching & Invalidation",
        category: "Infrastructure & Networking",
        tags: ["cdn", "caching", "static assets", "cloudfront", "edge"],
        summary: "Covers static asset caching on CloudFront/Akamai edge nodes, TTL configuration, and invalidation APIs.",
        content: `# CDN Edge Asset Caching

Content Delivery Networks cache static build assets at edge PoPs globally.
Set Cache-Control headers to 'public, max-age=31536000, immutable' for hashed static assets.`
      })
    );

    vault.addFileEntry(
      new WikiFileEntry({
        filePath: "vault/databases/postgres-replication.md",
        title: "PostgreSQL Streaming Replication & High Availability",
        category: "Databases",
        tags: ["postgresql", "replication", "wal", "primary-replica", "failover"],
        summary: "Overview of streaming WAL replication, replica read scaling, and Patroni automatic failover orchestration.",
        content: `# PostgreSQL Streaming Replication Guide

PostgreSQL streams Write-Ahead Log (WAL) records from primary to read-replicas.
Patroni uses etcd distributed key-value store to manage leader election and failover.`
      })
    );

    return vault;
  }
}
