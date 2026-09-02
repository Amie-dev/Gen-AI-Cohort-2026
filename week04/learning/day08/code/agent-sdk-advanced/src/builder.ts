import { Agent } from "./agent.js";
import { IInputGuardrail, IOutputGuardrail, ITool, Interceptor } from "./types.js";

export class AgentBuilder {
  public name: string = "DefaultAgent";
  public instructions: string = "You are a helpful AI assistant.";
  public toolList: ITool[] = [];
  public inputGuardrails: IInputGuardrail[] = [];
  public outputGuardrails: IOutputGuardrail[] = [];
  public interceptors: Interceptor[] = [];
  public modelName: string = "gpt-4o";
  public maxLoop: number = 30;
  public apiKey?: string;

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public setInstructions(instructions: string): this {
    this.instructions = instructions;
    return this;
  }

  public tool(t: ITool): this {
    if (this.toolList.some((existing) => existing.name === t.name)) {
      throw new Error(`Tool '${t.name}' is already registered in agent '${this.name}'.`);
    }
    this.toolList.push(t);
    return this;
  }

  public addInputGuardrail(guardrail: IInputGuardrail): this {
    this.inputGuardrails.push(guardrail);
    return this;
  }

  public addOutputGuardrail(guardrail: IOutputGuardrail): this {
    this.outputGuardrails.push(guardrail);
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
