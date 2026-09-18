export interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
}

export class TaskService {
  private tasks: Map<string, Task> = new Map();
  private counter = 100;

  constructor() {
    this.createTask("Review MCP Architecture Documentation", "high");
    this.createTask("Setup initial TypeScript project workspace", "medium");
  }

  public createTask(title: string, priority: "low" | "medium" | "high"): Task {
    const id = `task_${++this.counter}`;
    const task: Task = {
      id,
      title,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(id, task);
    return task;
  }

  public updateTask(id: string, title?: string, priority?: "low" | "medium" | "high"): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task with ID ${id} not found.`);

    if (title !== undefined) task.title = title;
    if (priority !== undefined) task.priority = priority;

    return task;
  }

  public completeTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task with ID ${id} not found.`);

    task.completed = true;
    return task;
  }

  public searchTasks(query?: string): Task[] {
    const list = Array.from(this.tasks.values());
    if (!query) return list;

    const q = query.toLowerCase();
    return list.filter(
      (t) => t.title.toLowerCase().includes(q) || t.priority.toLowerCase() === q
    );
  }

  public getTasksByPriority(priority: string): Task[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.priority.toLowerCase() === priority.toLowerCase()
    );
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}
