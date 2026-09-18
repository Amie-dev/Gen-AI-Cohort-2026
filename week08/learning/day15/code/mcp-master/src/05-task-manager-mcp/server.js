import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaskService } from "./task.service.js";
export function createTaskServer() {
    const server = new McpServer({
        name: "mcp-task-manager",
        version: "1.0.0",
    });
    const taskService = new TaskService();
    // Tool: create_task
    server.tool("create_task", "Create a new task", {
        title: z.string().min(1).describe("Task title / description"),
        priority: z.enum(["low", "medium", "high"]).describe("Task priority level"),
    }, async ({ title, priority }) => {
        const task = taskService.createTask(title, priority);
        return {
            content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
    });
    // Tool: update_task
    server.tool("update_task", "Update an existing task's title or priority", {
        id: z.string().describe("Task ID"),
        title: z.string().optional().describe("New title"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("New priority"),
    }, async ({ id, title, priority }) => {
        try {
            const task = taskService.updateTask(id, title, priority);
            return {
                content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Task Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Tool: complete_task
    server.tool("complete_task", "Mark a task as completed", {
        taskId: z.string().describe("Task ID to complete"),
    }, async ({ taskId }) => {
        try {
            const task = taskService.completeTask(taskId);
            return {
                content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `Task Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Tool: search_tasks
    server.tool("search_tasks", "Search tasks by title keyword or priority", {
        query: z.string().optional().describe("Search keyword"),
    }, async ({ query }) => {
        const tasks = taskService.searchTasks(query);
        return {
            content: [{ type: "text", text: JSON.stringify({ count: tasks.length, tasks }, null, 2) }],
        };
    });
    // Resource: tasks://all
    server.resource("all-tasks", "tasks://all", async (uri) => {
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
    });
    // Prompt: daily-plan
    server.prompt("daily-plan", {
        date: z.string().describe("Target plan date (e.g. 2026-09-18)"),
    }, ({ date }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate a prioritized daily execution plan for ${date}. Fetch all high-priority pending tasks from the task manager MCP server and group them by urgency.`,
                },
            },
        ],
    }));
    return server;
}
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
    const server = createTaskServer();
    const transport = new StdioServerTransport();
    server.connect(transport).catch((err) => {
        console.error("Fatal error starting Task Manager MCP Server:", err);
        process.exit(1);
    });
}
