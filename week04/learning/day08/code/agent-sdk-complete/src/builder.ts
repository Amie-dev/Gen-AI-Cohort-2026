import { Agent } from "./agent.js";
import { ITool, Interceptor } from "./types.js";

export class AgentBuilder {
  public instructions: string = "You are a helpful AI assistant.";
  public toolList: ITool[] = [];
  public interceptors: Interceptor[] = [];
  public modelName: string = "gpt-4o";
  public maxLoop: number = 30;
  public apiKey?: string;

  constructor() {}

  public setInstructions(instructions: string): this {
    this.instructions = instructions;
    return this;
  }

  public tool(t: ITool): this {
    if (this.toolList.some((existing) => existing.name === t.name)) {
      throw new Error(`Tool with name '${t.name}' is already registered.`);
    }
    this.toolList.push(t);
    return this;
  }

  public model(modelName: string): this {
    this.modelName = modelName;
    return this;
  }

  public setMaxLoop(limit: number): this {
    this.maxLoop = limit;
    return this;
  }

  public setApiKey(key: string): this {
    this.apiKey = key;
    return this;
  }

  public attachInterceptor(interceptor: Interceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  public build(): Agent {
    return new Agent(this);
  }
}
