export class TaskService {
    tasks = new Map();
    counter = 100;
    constructor() {
        this.createTask("Review MCP Architecture Documentation", "high");
        this.createTask("Setup initial TypeScript project workspace", "medium");
    }
    createTask(title, priority) {
        const id = `task_${++this.counter}`;
        const task = {
            id,
            title,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        this.tasks.set(id, task);
        return task;
    }
    updateTask(id, title, priority) {
        const task = this.tasks.get(id);
        if (!task)
            throw new Error(`Task with ID ${id} not found.`);
        if (title !== undefined)
            task.title = title;
        if (priority !== undefined)
            task.priority = priority;
        return task;
    }
    completeTask(id) {
        const task = this.tasks.get(id);
        if (!task)
            throw new Error(`Task with ID ${id} not found.`);
        task.completed = true;
        return task;
    }
    searchTasks(query) {
        const list = Array.from(this.tasks.values());
        if (!query)
            return list;
        const q = query.toLowerCase();
        return list.filter((t) => t.title.toLowerCase().includes(q) || t.priority.toLowerCase() === q);
    }
    getTasksByPriority(priority) {
        return Array.from(this.tasks.values()).filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
}
