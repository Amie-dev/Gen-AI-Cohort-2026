# Chapter 5: Stateful Task Manager MCP Server

## 1. Overview & Dynamic State Management

Module 5 demonstrates building a stateful MCP server. Unlike stateless utility tools (like math or weather), stateful MCP servers maintain in-memory or persistent data models across multiple tool invocations.

This module introduces:
- **Dynamic Task Mutations**: Tools to create, update, and complete tasks.
- **Dynamic Resources**: The `tasks://all` resource endpoint, returning live JSON task snapshots.
- **Planner Prompts**: The `daily-plan` prompt template for LLM scheduling.

---

## 2. Task Service (`task.service.ts`)

Source file: [task.service.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/05-task-manager-mcp/task.service.ts)

```typescript
export interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  createdAt: string;
}

export class TaskService {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    // Seed initial tasks
    this.createTask("Setup TypeScript MCP Project", "high");
    this.createTask("Build Database Query MCP Server", "medium");
  }

  public createTask(title: string, priority: "low" | "medium" | "high"): Task {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTask: Task = {
      id,
      title,
      priority,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  public updateTask(id: string, title?: string, priority?: "low" | "medium" | "high"): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task with ID '${id}' not found.`);
    if (title) task.title = title;
    if (priority) task.priority = priority;
    return task;
  }

  public completeTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task with ID '${id}' not found.`);
    task.status = "completed";
    return task;
  }

  public searchTasks(query?: string): Task[] {
    const all = Array.from(this.tasks.values());
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter((t) => t.title.toLowerCase().includes(q) || t.priority === q);
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}
```

---

## 3. Task Manager MCP Server (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/05-task-manager-mcp/server.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaskService } from "./task.service.js";

export function createTaskServer(): McpServer {
  const server = new McpServer({
    name: "mcp-task-manager",
    version: "1.0.0",
  });

  const taskService = new TaskService();

  // Tool 1: create_task
  server.tool(
    "create_task",
    "Create a new task",
    {
      title: z.string().min(1).describe("Task title / description"),
      priority: z.enum(["low", "medium", "high"]).describe("Task priority level"),
    },
    async ({ title, priority }) => {
      const task = taskService.createTask(title, priority);
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  // Tool 2: update_task
  server.tool(
    "update_task",
    "Update an existing task's title or priority",
    {
      id: z.string().describe("Task ID"),
      title: z.string().optional().describe("New title"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("New priority"),
    },
    async ({ id, title, priority }) => {
      try {
        const task = taskService.updateTask(id, title, priority);
        return {
          content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Task Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: complete_task
  server.tool(
    "complete_task",
    "Mark a task as completed",
    {
      taskId: z.string().describe("Task ID to complete"),
    },
    async ({ taskId }) => {
      try {
        const task = taskService.completeTask(taskId);
        return {
          content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Task Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: search_tasks
  server.tool(
    "search_tasks",
    "Search tasks by title keyword or priority",
    {
      query: z.string().optional().describe("Search keyword"),
    },
    async ({ query }) => {
      const tasks = taskService.searchTasks(query);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: tasks.length, tasks }, null, 2) }],
      };
    }
  );

  // Resource: tasks://all
  server.resource(
    "all-tasks",
    "tasks://all",
    async (uri) => {
      const tasks = taskService.getAllTasks();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tasks, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Prompt: daily-plan
  server.prompt(
    "daily-plan",
    {
      date: z.string().describe("Target plan date (e.g. 2026-09-18)"),
    },
    ({ date }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a prioritized daily execution plan for ${date}. Fetch all high-priority pending tasks from the task manager MCP server and group them by urgency.`,
          },
        },
      ],
    })
  );

  return server;
}
```

---

## 4. Client Implementation (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/05-task-manager-mcp/client.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting Task Manager MCP Client test...");

  const serverPath = path.join(__dirname, "server.ts");
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverPath],
  });

  const client = new Client(
    { name: "task-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to Task Manager MCP Server via STDIO");

  // 1. Create a Task
  const createRes = await client.callTool({
    name: "create_task",
    arguments: { title: "Implement MCP Gateway router", priority: "high" },
  });
  console.log("\n📝 Created Task:\n", (createRes.content as any[])?.[0]?.text);

  const createdTask = JSON.parse((createRes.content as any[])?.[0]?.text);

  // 2. Complete Task
  const completeRes = await client.callTool({
    name: "complete_task",
    arguments: { taskId: createdTask.id },
  });
  console.log("\n✅ Completed Task:\n", (completeRes.content as any[])?.[0]?.text);

  // 3. Read Resource 'tasks://all'
  const resourceRes = await client.readResource({ uri: "tasks://all" });
  console.log("\n📄 Reading Resource 'tasks://all':\n", (resourceRes.contents[0] as any)?.text);

  await client.close();
  console.log("\n👋 Task Manager Client test complete.");
}

main().catch((err) => {
  console.error("❌ Task client error:", err);
  process.exit(1);
});
```

---

## 5. Execution & Verification

Run the test client via NPM:

```bash
npm run dev:05-task-manager
```

### Expected Output
```text
🚀 Starting Task Manager MCP Client test...
✅ Connected to Task Manager MCP Server via STDIO

📝 Created Task:
 {
  "id": "task-1726678500000-412",
  "title": "Implement MCP Gateway router",
  "priority": "high",
  "status": "pending",
  "createdAt": "2026-09-18T15:55:00.000Z"
}

✅ Completed Task:
 {
  "id": "task-1726678500000-412",
  "title": "Implement MCP Gateway router",
  "priority": "high",
  "status": "completed",
  "createdAt": "2026-09-18T15:55:00.000Z"
}

📄 Reading Resource 'tasks://all':
 [
  { "id": "task-1", "title": "Setup TypeScript MCP Project", "priority": "high", "status": "pending" },
  { "id": "task-2", "title": "Build Database Query MCP Server", "priority": "medium", "status": "pending" },
  { "id": "task-1726678500000-412", "title": "Implement MCP Gateway router", "priority": "high", "status": "completed" }
]

👋 Task Manager Client test complete.
```
