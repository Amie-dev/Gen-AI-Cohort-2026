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

  // Tool: list_tables
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

  // Tool: get_schema
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

  // Tool: search_records (safe parameterized filter instead of raw SQL injection danger)
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

  // Tool: get_record_by_id
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

if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const server = createDatabaseServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Fatal error in Database MCP Server:", err);
    process.exit(1);
  });
}
