import { TreeNode } from "./TreeNode.js";
import { HierarchicalTreeIndex } from "./HierarchicalTreeIndex.js";

/**
 * TreeBuilder is a factory builder that generates structured document trees.
 */
export class TreeBuilder {
  /**
   * Constructs a sample 3-level document tree representing a Distributed Systems Architecture Manual.
   * @returns {HierarchicalTreeIndex}
   */
  static buildSampleDistributedSystemsTree() {
    const root = new TreeNode({
      nodeId: "root",
      title: "Distributed Systems Architecture Manual v2.0",
      level: 0,
      pageRange: [1, 500],
      summary: "Comprehensive manual covering networking, load balancing, sticky sessions, database replication, and consensus.",
      keywords: ["distributed systems", "load balancing", "replication", "consensus", "networking"],
      entities: ["AWS ALB", "Redis Cluster", "PostgreSQL", "Raft", "CDN"]
    });

    // Chapter 1
    const ch1 = new TreeNode({
      nodeId: "ch_1",
      title: "Chapter 1: Networking & Edge Routing Architecture",
      level: 1,
      pageRange: [1, 120],
      summary: "Covers TCP/IP networking, BGP routing protocols, DNS edge resolution, and TLS termination.",
      keywords: ["networking", "bgp", "dns", "tls", "edge routing"],
      entities: ["Cloudflare", "Route53", "BGP Router"]
    });

    // Chapter 2
    const ch2 = new TreeNode({
      nodeId: "ch_2",
      title: "Chapter 2: Load Balancing & Traffic Distribution",
      level: 1,
      pageRange: [121, 250],
      summary: "Detailed breakdown of Content Delivery Networks (CDN) vs Application Load Balancers (ALB) and sticky sessions.",
      keywords: ["load balancing", "alb", "sticky sessions", "session persistence", "failover"],
      entities: ["AWS ALB", "NGINX", "HAProxy"]
    });

    const sec21 = new TreeNode({
      nodeId: "sec_2_1",
      title: "Section 2.1: CDN Edge Static Asset Caching",
      level: 2,
      pageRange: [121, 160],
      summary: "Explains static asset edge caching, TTL cache control headers, and cache invalidation strategies.",
      keywords: ["cdn", "caching", "static assets", "ttl", "invalidation"],
      entities: ["Akamai", "CloudFront"],
      content: `FULL SECTION CONTENT (pp. 121-160):
Edge CDNs intercept static HTTP requests (JS, CSS, images) before they hit backend origins.
Cache-Control headers determine edge TTL (Time-To-Live). Instant purge invalidation APIs must be invoked
whenever new build artifacts are deployed to prevent stale asset serving.`
    });

    const sec22 = new TreeNode({
      nodeId: "sec_2_2",
      title: "Section 2.2: Session Persistence & Sticky Sessions",
      level: 2,
      pageRange: [161, 250],
      summary: "In-depth analysis of cookie-based sticky sessions on ALBs, failover handling when backend nodes crash, and Redis session re-hydration.",
      keywords: ["sticky sessions", "session persistence", "alb", "awsalb cookie", "failover", "redis"],
      entities: ["AWSALB Cookie", "Redis Cluster", "EC2 Target Group"],
      content: `FULL SECTION CONTENT (pp. 161-250):
When an Application Load Balancer (ALB) handles sticky sessions, it injects an encrypted cookie (AWSALB)
into HTTP response headers. Subsequent user requests containing this cookie are routed exclusively to the same
backend application server instance.

FAILOVER MECHANISM:
If the primary backend server fails health checks (3 consecutive 502 timeouts), the ALB invalidates the
sticky cookie mapping and executes a consistent hash ring re-route to an active backup server instance.
Session state must be restored from a centralized Redis cluster to prevent session drop.`
    });

    ch2.addChild(sec21);
    ch2.addChild(sec22);

    // Chapter 3
    const ch3 = new TreeNode({
      nodeId: "ch_3",
      title: "Chapter 3: Distributed Database Replication",
      level: 1,
      pageRange: [251, 500],
      summary: "Primary-replica streaming replication, WAL log shipping, quorum consensus, and Paxos/Raft protocol implementations.",
      keywords: ["database replication", "primary-replica", "wal log", "quorum", "raft"],
      entities: ["PostgreSQL", "Raft Consensus Engine"]
    });

    root.addChild(ch1);
    root.addChild(ch2);
    root.addChild(ch3);

    return new HierarchicalTreeIndex(root.title, root);
  }
}
