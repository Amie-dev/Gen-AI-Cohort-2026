# Chapter 2 — Fluent Agent Builder & Configuration

## 1. Chapter Goal

The goal of this chapter is to implement the **Fluent Builder Pattern** (`AgentBuilder`) inside `src/builder.ts`.

Advanced agents require multiple configuration parameters: identity names, system prompts, tool collections, input guardrails, output guardrails, real-time logging interceptors, model names, max loop limits, and API keys. The `AgentBuilder` class provides an intuitive, method-chained API for assembling agents safely.

In this chapter, we:
* Build the `AgentBuilder` class
* Implement fluent chainable methods for tools, guardrails, and interceptors
* Add validation safeguards (preventing duplicate tool registrations)

---

### 🎯 Expected Outcome

Developers can configure enterprise agents using clean fluent syntax:

```typescript
const agent = Agent.builder("DevOpsAgent")
  .setInstructions("You execute shell operations safely.")
  .tool(cliAccessTool)
  .addInputGuardrail(securityGuardrail)
  .addInputGuardrail(cliSafetyGuardrail)
  .addOutputGuardrail(piiRedactionGuardrail)
  .attachInterceptor(consoleLoggerInterceptor)
  .build();
```

---

## 2. Implementation of `src/builder.ts`

### File Path

```text
agent-sdk-advanced/src/builder.ts
```

### Code

```typescript
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
```

---

## 3. Builder Method Safeguards

### 1. Duplicate Tool Prevention

Registering two tools with the exact same name creates ambiguity during LLM function dispatch. `AgentBuilder.tool()` throws an explicit error if a tool is registered twice:

```typescript
if (this.toolList.some((existing) => existing.name === t.name)) {
  throw new Error(`Tool '${t.name}' is already registered in agent '${this.name}'.`);
}
```

### 2. Type-Safe Return Values (`this`)

Every configuration method returns `this`, preserving class context across multi-step chains.

---

## 4. Verification & Testing

Verify duplicate tool protection behavior:

```bash
npx tsx -e "
import { AgentBuilder } from './src/builder.js';
const builder = new AgentBuilder('TestAgent')
  .tool({ name: 'myTool', description: 'desc', executor: () => 'ok' });
try {
  builder.tool({ name: 'myTool', description: 'desc', executor: () => 'ok' });
} catch (e) {
  console.log('Successfully caught error:', e.message);
}
"
```

### Expected Output

```text
Successfully caught error: Tool 'myTool' is already registered in agent 'TestAgent'.
```

Move to **Chapter 3** to build the Guardrails Framework and Interceptor Logger.
