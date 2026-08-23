import { TreeNode } from "./TreeNode.js";
import { HierarchicalTreeIndex } from "./HierarchicalTreeIndex.js";

/**
 * Builds a Hierarchical Document Tree from sample structured technical document input.
 */
export class TreeBuilder {
  /**
   * Constructs sample production manual tree hierarchy.
   * @returns {HierarchicalTreeIndex}
   */
  static buildSampleManualTree() {
    // Level 0: Root Document Node
    const root = new TreeNode({
      nodeId: "root",
      title: "Distributed Systems Architecture Manual v2.0",
      level: 0,
      pageRange: [1, 500],
      summary: "Master reference manual covering global networking, load balancing, sticky sessions, database replication, and failover mechanics.",
      keywords: ["distributed systems", "load balancing", "networking", "replication"],
      entities: ["Global Edge Infra", "AWS ALB", "PostgreSQL", "Redis"]
    });

    // Level 1: Chapter 1
    const ch1 = new TreeNode({
      nodeId: "ch_1",
      title: "Chapter 1: Networking & Edge Routing Architecture",
      level: 1,
      pageRange: [1, 120],
      summary: "Covers TCP/IP networking, BGP routing protocols, DNS edge resolution, and TLS termination proxies.",
      keywords: ["networking", "dns", "bgp", "proxy", "tls"],
      entities: ["BGP Routers", "Cloudflare Edge", "DNS Gateway"]
    });

    // Level 1: Chapter 2
    const ch2 = new TreeNode({
      nodeId: "ch_2",
      title: "Chapter 2: Load Balancing & Traffic Distribution",
      level: 1,
      pageRange: [121, 250],
      summary: "Detailed architectural breakdown of Content Delivery Networks (CDN) vs Application Load Balancers (ALB), session persistence algorithms, and sticky sessions.",
      keywords: ["load balancing", "alb", "cdn", "sticky sessions", "session persistence"],
      entities: ["AWS ALB", "Cloudflare CDN", "EC2 AutoScaling"]
    });

    // Level 1: Chapter 3
    const ch3 = new TreeNode({
      nodeId: "ch_3",
      title: "Chapter 3: Distributed Database Replication",
      level: 1,
      pageRange: [251, 500],
      summary: "Primary-replica streaming replication, WAL log shipping, quorum consensus, and Patroni failover orchestration.",
      keywords: ["database", "postgres", "wal", "replication", "patroni"],
      entities: ["PostgreSQL 16", "Patroni", "Consul Key-Value"]
    });

    // Level 2: Subsections under Chapter 2
    const sec2_1 = new TreeNode({
      nodeId: "sec_2_1",
      title: "Section 2.1: CDN Edge Static Asset Caching",
      level: 2,
      pageRange: [121, 160],
      summary: "Explains static asset edge caching, TTL cache control headers, cache invalidation hooks, and edge worker routing.",
      keywords: ["cdn", "caching", "ttl", "static assets", "edge workers"],
      entities: ["Cloudflare Workers", "S3 Bucket"],
      content: `FULL SECTION CONTENT (pp. 121-160):
Content Delivery Network (CDN) edge nodes cache high-volume static assets (CSS, JS, images, videos) 
at global PoPs (Points of Presence). Cache invalidation is triggered asynchronously via webhooks whenever 
new frontend static build bundles are deployed to S3 storage.`
    });

    const sec2_2 = new TreeNode({
      nodeId: "sec_2_2",
      title: "Section 2.2: Session Persistence & Sticky Sessions",
      level: 2,
      pageRange: [161, 250],
      summary: "In-depth analysis of cookie-based sticky sessions on ALBs, failover handling when upstream app servers crash, and session state recovery.",
      keywords: ["sticky sessions", "alb", "session persistence", "failover", "cookies"],
      entities: ["AWSALB Cookie", "Application Load Balancer", "Redis Cluster"],
      content: `FULL SECTION CONTENT (pp. 161-250):
When an Application Load Balancer (ALB) handles sticky sessions, it injects an encrypted cookie (AWSALB) 
into HTTP response headers. Subsequent user requests containing this cookie are routed exclusively to the same 
backend application server instance.

FAILOVER MECHANISM:
If the primary backend server fails health checks (3 consecutive 502 timeouts), the ALB invalidates the 
sticky cookie mapping and executes a consistent hash ring re-route to an active backup server instance. 
Session state must be restored from a centralized Redis cluster to prevent session drop.`
    });

    // Wire up tree hierarchy
    ch2.addChild(sec2_1);
    ch2.addChild(sec2_2);

    root.addChild(ch1);
    root.addChild(ch2);
    root.addChild(ch3);

    return new HierarchicalTreeIndex(root, "Distributed Systems Architecture Manual v2.0");
  }
}
