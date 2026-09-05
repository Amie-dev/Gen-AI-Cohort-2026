# Chapter 3 — Core Autonomous Agent Engine & ReAct Loop

## 1. Chapter Goal

The goal of this chapter is to implement the core **`Agent` Engine** class in `src/app/agent.ts`.

The `Agent` engine is the central execution runtime of the SDK. It maintains internal message history trajectories, builds dynamic system prompts containing harness rules and tool descriptors, manages model completions via OpenAI's GPT-4o, dispatches event notifications to interceptors, and executes the autonomous **ReAct loop** with automatic tool lookup and result injection.

In this chapter, we:
* Build the dynamic system prompt generator combining `HARNESS_PROMPT`, developer system instructions, and tool JSON schemas
* Implement event interceptor management (`attachInterceptor`, `notifyInterceptors`)
* Write the autonomous `run(query: string)` loop (`MAX_LOOP = 30`)
* Implement tool execution dispatch and developer feedback messaging

---

### 🎯 Expected Outcome

By the end of this chapter, `src/app/agent.ts` will contain the complete operational runtime engine for the Agent framework.

```text
User Query: "what is weather of Goa?"
     │
     ▼
agent.run(query)
     │
     ├── 1. Format System Prompt (Harness + Instructions + Tool Specs)
     ├── 2. Add query to messageHistory
     │
     ├── 🔄 Loop (i = 0 to 30):
     │     ├── Call OpenAI GPT-4o
     │     ├── Parse Step JSON
     │     │
     │     ├── If step === "TOOL_REQUEST":
     │     │     ├── Lookup function in toolMap
     │     │     ├── Execute tool.executor(input)
     │     │     ├── Append developer result to messageHistory
     │     │     └── Notify interceptors
     │     │
     │     └── If step === "OUTPUT":
     │           └── Return messageHistory trajectory
```

---

## 2. Dynamic System Prompt Assembly

When an `Agent` instance is instantiated from an `AgentBuilder`, it automatically constructs a unified system prompt combining three critical components:

```text
+-----------------------------------------------------------------------------------+
|                              UNIFIED SYSTEM PROMPT                                |
+-----------------------------------------------------------------------------------+
|  1. HARNESS_PROMPT     --> Pipeline step rules ("INITIAL", "THINK", etc.)         |
|  2. System Instructions --> Custom role directives ("You are an expert agent...") |
|  3. Available Tools    --> Serialized tool schemas ([{functionName, doc, ...}])   |
+-----------------------------------------------------------------------------------+
```

### Tool Serialization Strategy

Tools registered in `AgentBuilder.toolList` are serialized into JSON strings inside the System Prompt:

```typescript
this.instructions = `
    ${HARNESS_PROMPT}\n\n

    System Prompt:
    ${builder.instructions}

    Available Tools:
    ${builder.toolList.map((t) => JSON.stringify({ 
        functionName: t.name, 
        functionDescription: t.description, 
        functionDoc: t.doc 
    })).join("\n")}
`;
```

---

## 3. Complete Implementation of `src/app/agent.ts`

### File Path

```text
agent-sdk-sir/src/app/agent.ts
```

### Code

```typescript
import { HARNESS_PROMPT } from "./config.js";
import Openai from "openai";

export interface IMessage {
  role: "user" | "assistant" | "developer";
  content: string;
}

export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string>;
}

export type Interceptor = (message: IMessage) => void;

export class AgentBuilder {
  public instructions: string | undefined;
  public toolList: ITool[];

  constructor() {
    this.toolList = [];
  }

  public setIntructions(instructions: string) {
    this.instructions = instructions;
    return this;
  }

  public tool(t: ITool) {
    this.toolList.push(t);
    return this;
  }

  public build() {
    return new Agent(this);
  }
}

export class Agent {
  private instructions: string;
  private messageHistory: IMessage[];
  private toolMap: Map<string, ITool>;
  private openai: Openai;

  private interceptors: Interceptor[];

  private MAX_LOOP = 30;

  constructor(builder: AgentBuilder) {
    this.toolMap = new Map();
    this.openai = new Openai({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    this.interceptors = [];

    for (const t of builder.toolList) {
      this.toolMap.set(t.name, t);
    }

    this.instructions = `
            ${HARNESS_PROMPT}\n\n

            System Prompt:
            ${builder.instructions}

            Available Tools:
            ${builder.toolList.map((t) => JSON.stringify({ functionName: t.name, functionDescription: t.description, functionDoc: t.doc })).join("\n")}

        `;
    this.messageHistory = [];
  }

  public attachInterceptor(interceptor: Interceptor) {
    this.interceptors.push(interceptor);
  }

  private notifyInterceptors(message: IMessage) {
    for (const interceptor of this.interceptors) {
      interceptor(message);
    }
  }

  static builder() {
    return new AgentBuilder();
  }

  public printSystemPrompt() {
    console.log(this.instructions);
  }

  public async run(query: string) {
    // Append Query to Message HISTORY
    this.messageHistory.push({ role: "user", content: query });

    for (let i = 0; i < this.MAX_LOOP; i++) {
      // Call LLM (SYSTEM PROMPT + MESSAGE HISTORY)
      const llmResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.instructions },
          ...this.messageHistory.map((e) => ({
            role: e.role,
            content: e.content,
          })),
        ],
      });

      const rawLLMResponse: string = llmResponse.choices[0]?.message
        .content as string;

      // Append LLMResponse to Message HISTORY
      this.messageHistory.push({ role: "assistant", content: rawLLMResponse });
      this.notifyInterceptors({ role: "assistant", content: rawLLMResponse });

      // Parse the Raw LLM Response to JSON Object
      const parsedReult = JSON.parse(rawLLMResponse);

      // If LLMResponse.step === "OUTPUT" break (Stop Condition)
      if (parsedReult.step.toLowerCase() === "output")
        return this.messageHistory;

      // If LLMResponse.step === "TOOL_REQUEST"
      if (parsedReult.step.toLowerCase() === "tool_request") {
        const { functionName, input } = parsedReult;
        const tool = this.toolMap.get(functionName);

        if (!tool) {
          this.messageHistory.push({
            role: "developer",
            content: `Error: Function with name ${functionName} does not exists`,
          });
          continue;
        }

        const toolResult = await tool.executor(input);
        this.messageHistory.push({
          role: "developer",
          content: JSON.stringify({
            functionName,
            input,
            toolResult,
          }),
        });
        this.notifyInterceptors({
          role: "developer",
          content: JSON.stringify({
            functionName,
            input,
            toolResult,
          }),
        });
      }
    }
  }
}
```

---

## 4. Deep Dive into `run(query: string)` Mechanics

### 1. Trajectory Initialization

The user query is pushed to `messageHistory` as a `"user"` role message:

```typescript
this.messageHistory.push({ role: "user", content: query });
```

### 2. Model Completion Call

On every iteration of `MAX_LOOP`, `messageHistory` is passed alongside the dynamic system prompt:

```typescript
const llmResponse = await this.openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: this.instructions },
    ...this.messageHistory.map((e) => ({
      role: e.role,
      content: e.content,
    })),
  ],
});
```

### 3. Step Parsing & Interceptors

The model's raw string response is appended to trajectory, dispatched to interceptors, and parsed into a JSON step object:

```typescript
const parsedReult = JSON.parse(rawLLMResponse);
```

### 4. Termination vs. Tool Dispatch

* If `parsedReult.step === "OUTPUT"`, the loop terminates and returns `messageHistory`.
* If `parsedReult.step === "TOOL_REQUEST"`, the tool is retrieved from `toolMap`. The `executor(input)` promise is awaited, and the output is appended as a `"developer"` role message so the model can read tool results in the next turn.

---

## 5. Verification & Testing

Verify that `src/app/agent.ts` compiles cleanly:

```bash
npx tsc --noEmit
```

With the Core Engine completed, move to **Chapter 4** to build custom tools and execute end-to-end queries in `src/index.ts`.
