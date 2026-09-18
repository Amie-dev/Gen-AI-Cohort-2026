import { MCPGateway } from "./gateway.mjs";

async function runGatewayDemo() {
  console.log("============== 🚪 MCP GATEWAY & TOOL FILTERING DEMO ==============\n");

  const gateway = new MCPGateway();

  // 1. Register Downstream Server 1: Stripe Payment MCP Server (5 tools)
  gateway.registerServer(
    "stripe-server",
    "Stripe Payments Server",
    [
      { name: "stripe_create_charge", description: "Creates a new card payment charge" },
      { name: "stripe_refund_payment", description: "Processes a refund for a transaction" },
      { name: "stripe_list_invoices", description: "Retrieves customer billing invoices" },
      { name: "stripe_cancel_subscription", description: "Cancels an active user recurring plan" },
      { name: "stripe_get_balance", description: "Returns account cash balance" },
    ],
    async (toolName, args) => {
      return { status: "success", tool: toolName, processed_by: "Stripe MCP Server", args };
    }
  );

  // 2. Register Downstream Server 2: GitHub Developer MCP Server (5 tools)
  gateway.registerServer(
    "github-server",
    "GitHub Enterprise Server",
    [
      { name: "github_create_issue", description: "Opens a new issue ticket" },
      { name: "github_create_pull_request", description: "Opens a new git pull request" },
      { name: "github_search_code", description: "Performs code search across repos" },
      { name: "github_list_commits", description: "Retrieves recent git commit log" },
      { name: "github_add_reviewer", description: "Assigns PR review responsibility" },
    ],
    async (toolName, args) => {
      return { status: "success", tool: toolName, processed_by: "GitHub MCP Server", args };
    }
  );

  // 3. Register Downstream Server 3: PostgreSQL Database MCP Server (4 tools)
  gateway.registerServer(
    "db-server",
    "PostgreSQL Database Server",
    [
      { name: "db_query_sql", description: "Executes a read-only SQL SELECT query" },
      { name: "db_get_table_schema", description: "Describes columns and constraints" },
      { name: "db_list_tables", description: "Returns array of all database tables" },
      { name: "db_explain_query", description: "Analyzes SQL query performance" },
    ],
    async (toolName, args) => {
      return { status: "success", tool: toolName, processed_by: "Database MCP Server", args };
    }
  );

  console.log(`\nTotal registered tools in Gateway: ${gateway.totalRegisteredToolsCount}`);

  // Scenario A: Without Gateway (Exposing all 14 tools -> Context Bloat)
  console.log("\n------------------------------------------------");
  console.log("❌ WITHOUT GATEWAY: LLM receives all 14 tool definitions in system prompt, causing context bloat!");

  // Scenario B: With Gateway Filtering (User asks about payment refund)
  const userQuery1 = "I need to refund payment transaction pay_88921";
  const filteredTools1 = gateway.filterToolsForQuery(userQuery1, 2);
  console.log("Filtered Tools provided to LLM Context:");
  filteredTools1.forEach((t) => console.log(`  - [${t.serverId}] ${t.name}: ${t.description}`));

  // Route call through Gateway
  const result1 = await gateway.routeCallTool("stripe_refund_payment", {
    payment_id: "pay_88921",
    reason: "Customer requested cancellation",
  });
  console.log("Routed Result:", result1);

  // Scenario C: User asks about GitHub code issue
  const userQuery2 = "Create a pull request for the auth bug fix";
  const filteredTools2 = gateway.filterToolsForQuery(userQuery2, 2);
  console.log("Filtered Tools provided to LLM Context:");
  filteredTools2.forEach((t) => console.log(`  - [${t.serverId}] ${t.name}: ${t.description}`));

  // Route call through Gateway
  const result2 = await gateway.routeCallTool("github_create_pull_request", {
    title: "fix(auth): resolve JWT expiration handling",
    branch: "fix-jwt-bug",
  });
  console.log("Routed Result:", result2);

  console.log("\n==================================================================");
  console.log("✅ Gateway Demo Finished: Successfully demonstrated tool filtering & routing!");
}

runGatewayDemo().catch(console.error);
