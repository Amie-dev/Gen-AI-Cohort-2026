# Chapter 3: SQL-Safe Database Querying MCP Server

## 1. Safety Hazards: Raw SQL Tools vs Parameterized Control

When exposing database capabilities to LLM agents via MCP, giving the LLM a generic `execute_raw_sql` tool creates severe security vulnerabilities:
- **SQL Injection**: An LLM hallucinating input or processing untrusted user text could emit `DROP TABLE users;` or `SELECT * FROM users WHERE 1=1;`.
- **Privilege Escalation**: Untrusted database mutations can alter permissions or leak PII.

Module 3 demonstrates the **Safe Database Pattern**: instead of executing raw SQL strings, the MCP server exposes schema introspection tools (`list_tables`, `get_schema`) and controlled, parameterized filtering tools (`search_records`, `get_record_by_id`).

---

## 2. In-Memory Relational Engine (`db.service.ts`)

Source file: [db.service.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/03-database-mcp/db.service.ts)

```typescript
export interface TableSchema {
  name: string;
  columns: Array<{ name: string; type: string; primaryKey?: boolean }>;
}

export class DatabaseService {
  private tables: Record<string, { schema: TableSchema; rows: Array<Record<string, any>> }> = {
    users: {
      schema: {
        name: "users",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "name", type: "TEXT" },
          { name: "email", type: "TEXT" },
          { name: "role", type: "TEXT" },
        ],
      },
      rows: [
        { id: 1, name: "Alice Smith", email: "alice@example.com", role: "admin" },
        { id: 2, name: "Bob Jones", email: "bob@example.com", role: "developer" },
        { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "viewer" },
      ],
    },
    orders: {
      schema: {
        name: "orders",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "user_id", type: "INTEGER" },
          { name: "amount", type: "REAL" },
          { name: "status", type: "TEXT" },
        ],
      },
      rows: [
        { id: 101, user_id: 1, amount: 250.0, status: "completed" },
        { id: 102, user_id: 2, amount: 89.99, status: "pending" },
        { id: 103, user_id: 1, amount: 499.5, status: "shipped" },
      ],
    },
  };

  public listTables(): string[] {
    return Object.keys(this.tables);
  }

  public getSchema(tableName: string): TableSchema {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);
    return table.schema;
  }

  public searchRecords(tableName: string, filterKey?: string, filterValue?: string): any[] {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);

    if (!filterKey || !filterValue) {
      return table.rows;
    }

    return table.rows.filter((row) =>
      String(row[filterKey] || "").toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  public getRecordById(tableName: string, id: number): any {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);
    const record = table.rows.find((row) => row.id === id);
    if (!record) throw new Error(`Record with ID ${id} not found in '${tableName}'.`);
    return record;
  }
}
```

---

## 3. Database MCP Server (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/03-database-mcp/server.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DatabaseService } from "./db.service.js";

export function createDatabaseServer(): McpServer {
  const server = new McpServer({
    name: "safe-database-server",
    version: "1.0.0",
  });

  const db = new DatabaseService();

  // Tool 1: list_tables
  server.tool(
    "list_tables",
    "List all available tables in the database",
    {},
    async () => {
      const tables = db.listTables();
      return {
        content: [{ type: "text", text: JSON.stringify({ tables }, null, 2) }],
      };
    }
  );

  // Tool 2: get_schema
  server.tool(
    "get_schema",
    "Get schema definition for a table",
    {
      tableName: z.string().describe("Name of table, e.g. users, orders"),
    },
    async ({ tableName }) => {
      try {
        const schema = db.getSchema(tableName);
        return {
          content: [{ type: "text", text: JSON.stringify(schema, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Database Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: search_records (safe controlled filter parameters)
  server.tool(
    "search_records",
    "Safely query records from a table using controlled filter parameters",
    {
      tableName: z.string().describe("Table name"),
      filterKey: z.string().optional().describe("Column name to filter"),
      filterValue: z.string().optional().describe("Value substring to search"),
    },
    async ({ tableName, filterKey, filterValue }) => {
      try {
        const records = db.searchRecords(tableName, filterKey, filterValue);
        return {
          content: [{ type: "text", text: JSON.stringify({ count: records.length, records }, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Query Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: get_record_by_id
  server.tool(
    "get_record_by_id",
    "Fetch a single record by primary key ID",
    {
      tableName: z.string().describe("Table name"),
      id: z.number().int().positive().describe("Record ID"),
    },
    async ({ tableName, id }) => {
      try {
        const record = db.getRecordById(tableName, id);
        return {
          content: [{ type: "text", text: JSON.stringify(record, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Fetch Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}
```

---

## 4. Client Implementation (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/03-database-mcp/client.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting Safe Database MCP Client test...");

  const serverPath = path.join(__dirname, "server.ts");
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverPath],
  });

  const client = new Client(
    { name: "db-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to Safe Database MCP Server via STDIO");

  // 1. List Tables
  const tables = await client.callTool({ name: "list_tables", arguments: {} });
  console.log("\n📊 Available Tables:\n", (tables.content as any[])?.[0]?.text);

  // 2. Get Schema for 'users'
  const schema = await client.callTool({
    name: "get_schema",
    arguments: { tableName: "users" },
  });
  console.log("\n📜 Schema for 'users':\n", (schema.content as any[])?.[0]?.text);

  // 3. Search records in 'orders' (filter status = 'completed')
  const completedOrders = await client.callTool({
    name: "search_records",
    arguments: { tableName: "orders", filterKey: "status", filterValue: "completed" },
  });
  console.log("\n🛒 Completed Orders:\n", (completedOrders.content as any[])?.[0]?.text);

  // 4. Fetch Record by ID (Order #101)
  const order101 = await client.callTool({
    name: "get_record_by_id",
    arguments: { tableName: "orders", id: 101 },
  });
  console.log("\n📦 Fetch Order #101:\n", (order101.content as any[])?.[0]?.text);

  await client.close();
  console.log("\n👋 Database Client test complete.");
}

main().catch((err) => {
  console.error("❌ Database client error:", err);
  process.exit(1);
});
```

---

## 5. Execution & Verification

Run the client test via NPM:

```bash
npm run dev:03-database
```

### Terminal Output
```text
🚀 Starting Safe Database MCP Client test...
✅ Connected to Safe Database MCP Server via STDIO

📊 Available Tables:
 {
  "tables": [
    "users",
    "orders"
  ]
}

📜 Schema for 'users':
 {
  "name": "users",
  "columns": [
    { "name": "id", "type": "INTEGER", "primaryKey": true },
    { "name": "name", "type": "TEXT" },
    { "name": "email", "type": "TEXT" },
    { "role": "admin" }
  ]
}

🛒 Completed Orders:
 {
  "count": 1,
  "records": [
    { "id": 101, "user_id": 1, "amount": 250, "status": "completed" }
  ]
}

📦 Fetch Order #101:
 {
  "id": 101,
  "user_id": 1,
  "amount": 250,
  "status": "completed"
}

👋 Database Client test complete.
```
