/**
 * MCP Gateway - Centralized Proxy & Tool Router
 * 
 * Demonstrates:
 * 1. Multi-server / Multi-domain Tool Aggregation
 * 2. Dynamic Tool Filtering & Intent Matching (Prevents Tool Context Poisoning)
 * 3. Centralized Tool Invocation Routing & Audit Logging
 */

export class MCPGateway {
  constructor() {
    this.registeredServers = new Map();
    this.totalRegisteredToolsCount = 0;
  }

  /**
   * Register a domain MCP server with its tools
   */
  registerServer(serverId, serverName, tools, executor) {
    this.registeredServers.set(serverId, {
      id: serverId,
      name: serverName,
      tools: tools,
      executor: executor,
    });
    this.totalRegisteredToolsCount += tools.length;
    console.log(`[MCP Gateway] Registered server '${serverName}' (${serverId}) with ${tools.length} tools.`);
  }

  /**
   * List ALL raw registered tools across all downstream MCP servers
   */
  getAllRawTools() {
    const allTools = [];
    for (const server of this.registeredServers.values()) {
      for (const tool of server.tools) {
        allTools.push({
          ...tool,
          serverId: server.id,
        });
      }
    }
    return allTools;
  }

  /**
   * DYNAMIC TOOL FILTERING (Core Gateway Feature)
   * Converts user intent/query into a filtered subset of top-N relevant tools.
   * Prevents Context Poisoning (500 tools -> 2-3 tools)
   */
  filterToolsForQuery(userQuery, maxTools = 3) {
    const allTools = this.getAllRawTools();
    const queryLower = userQuery.toLowerCase();

    // Score tools based on keyword matching in tool name & description
    const scoredTools = allTools.map((tool) => {
      let score = 0;
      const textToSearch = `${tool.name} ${tool.description} ${tool.serverId}`.toLowerCase();

      // Keyword matching heuristics
      const keywords = queryLower.split(/\s+/);
      for (const word of keywords) {
        if (word.length > 2 && textToSearch.includes(word)) {
          score += 2;
        }
      }

      // Exact domain boosts
      if (queryLower.includes("payment") || queryLower.includes("refund") || queryLower.includes("stripe")) {
        if (tool.serverId === "stripe-server") score += 5;
      }
      if (queryLower.includes("github") || queryLower.includes("issue") || queryLower.includes("repo") || queryLower.includes("pr")) {
        if (tool.serverId === "github-server") score += 5;
      }
      if (queryLower.includes("database") || queryLower.includes("sql") || queryLower.includes("query") || queryLower.includes("user")) {
        if (tool.serverId === "db-server") score += 5;
      }

      return { tool, score };
    });

    // Sort by relevance score descending
    scoredTools.sort((a, b) => b.score - a.score);

    // Return top N tools with non-zero or highest scores
    const topScored = scoredTools.filter((item) => item.score > 0).slice(0, maxTools);

    // Fallback if no keywords matched: return first maxTools
    const resultTools = topScored.length > 0 
      ? topScored.map((item) => item.tool) 
      : allTools.slice(0, maxTools);

    console.log(`\n[MCP Gateway Filter] User Query: "${userQuery}"`);
    console.log(`[MCP Gateway Filter] Total Available: ${allTools.length} tools ➔ Filtered Down To: ${resultTools.length} tools`);

    return resultTools;
  }

  /**
   * Route tool invocation to target downstream server
   */
  async routeCallTool(toolName, args) {
    console.log(`\n[MCP Gateway Router] Intercepting tool invocation for '${toolName}'...`);
    
    // Find which server owns this tool
    let targetServer = null;
    for (const server of this.registeredServers.values()) {
      if (server.tools.some((t) => t.name === toolName)) {
        targetServer = server;
        break;
      }
    }

    if (!targetServer) {
      throw new Error(`[MCP Gateway] Tool '${toolName}' not found on any registered downstream server.`);
    }

    console.log(`[MCP Gateway Router] Routing call to '${targetServer.name}' (${targetServer.id})...`);
    const startTime = Date.now();

    // Execute through downstream server handler
    const result = await targetServer.executor(toolName, args);

    const latency = Date.now() - startTime;
    console.log(`[MCP Gateway Audit Log] Tool '${toolName}' completed in ${latency}ms.`);

    return result;
  }
}
