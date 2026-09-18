import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
    console.log("📝 Starting Task Manager MCP Client test...");
    const serverPath = path.join(__dirname, "server.ts");
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", serverPath],
    });
    const client = new Client({ name: "task-manager-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    console.log("✅ Connected to Task Manager MCP Server");
    // 1. List Initial Tasks (Resource)
    const tasksResource = await client.readResource({ uri: "tasks://all" });
    const taskDoc = tasksResource.contents[0];
    const taskText = taskDoc && "text" in taskDoc ? taskDoc.text : "";
    console.log("\n📄 Initial Tasks (from Resource 'tasks://all'):\n", taskText);
    // 2. Create Task
    const newTaskRes = await client.callTool({
        name: "create_task",
        arguments: { title: "Complete Day 15 MCP Master Notes + Implementation", priority: "high" },
    });
    const newTaskText = newTaskRes.content?.[0]?.text || "{}";
    console.log("\n➕ Created Task:\n", newTaskText);
    const newTask = JSON.parse(newTaskText);
    // 3. Search Tasks
    const searchRes = await client.callTool({
        name: "search_tasks",
        arguments: { query: "MCP" },
    });
    console.log("\n🔍 Search Tasks for 'MCP':\n", searchRes.content?.[0]?.text);
    // 4. Complete Task
    const completeRes = await client.callTool({
        name: "complete_task",
        arguments: { taskId: newTask.id },
    });
    console.log("\n✅ Completed Task:\n", completeRes.content?.[0]?.text);
    // 5. Get Daily Plan Prompt
    const promptRes = await client.getPrompt({
        name: "daily-plan",
        arguments: { date: "2026-09-18" },
    });
    console.log("\n📅 Daily Plan Prompt:\n", promptRes.messages[0]?.content);
    await client.close();
    console.log("\n👋 Task Manager Client test complete.");
}
main().catch((err) => {
    console.error("❌ Task Manager client error:", err);
    process.exit(1);
});
