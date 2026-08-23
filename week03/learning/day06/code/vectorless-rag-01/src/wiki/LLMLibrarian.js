import { WikiFileEntry, WikiVault } from "./WikiVault.js";

/**
 * LLMLibrarian represents the background LLM agent organizing human-readable Markdown wiki vaults.
 */
export class LLMLibrarian {
  /**
   * Initializes a sample production Wiki Vault with catalog entries.
   * @returns {WikiVault}
   */
  static buildSampleVault() {
    const vault = new WikiVault();

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/infrastructure/cdn-setup.md",
        title: "CDN Edge Caching & Distribution Guide",
        category: "infrastructure",
        tags: ["cdn", "cache", "edge", "cloudflare", "assets"],
        summary: "Configuring Cloudflare CDN edge rules, TTL headers, and static asset distribution.",
        rawContent: `# CDN Edge Caching Guide
Static asset distribution relies on Cloudflare CDN edge workers. Cache control headers 
set TTL to 86400 seconds (24 hours). Asset purge requests are dispatched asynchronously.`
      })
    );

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/infrastructure/alb-sticky-sessions.md",
        title: "Application Load Balancer (ALB) Sticky Sessions & Cookies",
        category: "infrastructure",
        tags: ["alb", "load-balancer", "sticky-sessions", "cookies", "aws"],
        summary: "Explains AWS ALB sticky sessions, cookie expiration, encrypted session cookies, and sticky routing failover behavior.",
        rawContent: `# ALB Sticky Sessions Architecture Guide

When sticky sessions are enabled on the AWS Application Load Balancer (ALB), 
the load balancer binds a user's session state to a specific backend EC2 target instance.

Key Cookie: AWSALB (Encrypted, 7-day default lifespan)
Failover Behavior: If sticky target instance drops out of target group due to 3 failed health checks, 
the ALB assigns a new sticky node and updates the browser cookie. Session state is re-hydrated from Redis.`
      })
    );

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/databases/postgres-replication.md",
        title: "PostgreSQL Primary-Replica Streaming Replication Mechanics",
        category: "databases",
        tags: ["postgres", "database", "replication", "failover", "wal"],
        summary: "Primary-replica streaming replication, WAL log shipping, and automatic Patroni failover orchestration.",
        rawContent: `# PostgreSQL Replication Guide
PostgreSQL replication uses WAL streaming over TCP port 5432. Standby nodes apply write-ahead logs in real time. 
Automatic failover is managed by Patroni using etcd distributed consensus.`
      })
    );

    return vault;
  }
}
