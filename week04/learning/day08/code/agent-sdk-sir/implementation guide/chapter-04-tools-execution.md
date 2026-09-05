# Chapter 4 — Custom Tool Implementation & End-to-End Execution

## 1. Chapter Goal

The goal of this chapter is to build custom **`ITool` implementations** and assemble the full agent application inside `src/index.ts`.

Custom tools extend the AI Agent's capabilities beyond static knowledge, allowing it to perform real-world side effects—such as fetching live web API data or executing command-line scripts directly on the host operating system.

In this chapter, we:
* Build `weatherTool` using `axios` to query `wttr.in`
* Build `cliAccessTool` using Node.js `child_process.exec` to run local terminal commands
* Attach logging interceptors to observe agent reasoning in real-time
* Execute an end-to-end query (`agent.run(...)`)

---

### 🎯 Expected Outcome

When executing `src/index.ts`, the Agent will autonomously break down the user query, issue a `TOOL_REQUEST` to run a CLI command, execute the command on the host OS, inspect the developer tool response, and complete the `OUTPUT` step.

```text
User: "can you build a simple hello world program in c++ on my current project as hello.cpp"
   │
   ├── [Assistant Step INITIAL]: Analyzing goal
   ├── [Assistant Step THINK]: Planning CLI file creation command
   ├── [Assistant Step TOOL_REQUEST]: functionName: "execCli", input: "cat << 'EOF' > hello.cpp..."
   │     │
   │     └── Tool Execution (cliAccessTool): Executes shell command
   │
   ├── [Developer Output]: Command output string returned
   ├── [Assistant Step ANALYSE]: Verified file created successfully
   └── [Assistant Step OUTPUT]: Returns confirmation answer
```

---

## 2. Implementing Custom Tools

### 1. Realtime Weather Tool (`weatherTool`)

Uses `axios` to fetch current weather text from `wttr.in`:

```typescript
const weatherTool: ITool = {
    name: 'fetchWeatherInfo',
    description: 'Fetches realtime weather data by cityname',
    doc: 'fetchWeatherInfo(cityName: string): WeatherReport',
    async executor(cityName) {
        const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
        const response = await axios.get(url, { responseType: 'text' });
        return JSON.stringify({ cityName, weatherInfo: response.data });
    },
};
```

### 2. Host CLI Access Tool (`cliAccessTool`)

Wraps `child_process.exec` in a JavaScript Promise to run local terminal commands:

```typescript
const cliAccessTool: ITool = {
    name: 'execCli',
    description: 'Runs a CLI command on users machine and returns output',
    doc: 'execCli(cli: string): CLIResponse',
    executor(cmd) {
        return new Promise((res, rej) => {
            exec(cmd, (err, out) => {
                if (err) return res(`There was an Error ${err}`);
                else return res(out);
            });
        });
    }
};
```

---

## 3. Implementation of `src/index.ts`

### File Path

```text
agent-sdk-sir/src/index.ts
```

### Code

```typescript
import { Agent, AgentBuilder } from './app/agent.js';
import type { ITool } from './app/agent.js';
import axios from 'axios';
import { exec } from 'child_process';

const weatherTool: ITool = {
    name: 'fetchWeatherInfo',
    description: 'Fetches realtime weather data by cityname',
    doc: 'fetchWeatherInfo(cityName: string): WeatherReport',
    async executor(cityName) {
        const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
        const response = await axios.get(url, { responseType: 'text' });
        return JSON.stringify({ cityName, weatherInfo: response.data });
    },
};

const cliAccessTool: ITool = {
    name: 'execCli',
    description: 'Runs a CLI command on users machine and returns output',
    doc: 'execCli(cli: string): CLIResponse',
    executor(cmd) {
        return new Promise((res, rej) => {
            exec(cmd, (err, out) => {
                if (err) return res(`There was an Error ${err}`);
                else return res(out);
            });
        });
    }
};

async function init() {
    // 1. Build Coding Agent with CLI Tool
    const agent: Agent = Agent.builder()
        .setIntructions(`You are an expert coding agent`)
        .tool(cliAccessTool)
        .build();

    // 2. Attach Logging Interceptor
    agent.attachInterceptor(message => console.log(`Message: ${message.role}: ${message.content}`));

    // 3. Run Query
    const result = await agent.run('can you build a simple hello world program in c++ on my current project as hello.cpp');
    
    // 4. Output Final Trajectory Step
    if (result && result.length > 0) {
        console.log('\n--- Final Output ---');
        console.log(result[result.length - 1]);
    }
}

init();
```

---

## 4. Real-time Interceptor Observation

Attaching an interceptor function captures every state change in the Agent loop:

```typescript
agent.attachInterceptor(message => console.log(`Message: ${message.role}: ${message.content}`));
```

### Sample Log Output Stream

```text
Message: assistant: { "step": "INITAL", "text": "The user wants to create a C++ Hello World program named hello.cpp in the current directory." }
Message: assistant: { "step": "THINK", "text": "I will use the execCli tool to write the C++ code to a file named hello.cpp." }
Message: assistant: { "step": "TOOL_REQUEST", "functionName": "execCli", "input": "echo '#include <iostream>\\n\\nint main() {\\n    std::cout << \"Hello, World!\" << std::endl;\\n    return 0;\\n}' > hello.cpp" }
Message: developer: {"functionName":"execCli","input":"echo ...","toolResult":""}
Message: assistant: { "step": "ANALYSE", "text": "The command executed successfully and created hello.cpp." }
Message: assistant: { "step": "OUTPUT", "text": "I have created the simple C++ Hello World program in hello.cpp." }
```

---

## 5. Verification & Testing

### 1. Compile TypeScript

Ensure zero compilation errors across the entire codebase:

```bash
npx tsc --noEmit
```

### 2. Execute Application

Export your OpenAI API key and run `src/index.ts`:

```bash
export OPENAI_API_KEY="your-api-key-here"
npx tsx src/index.ts
```

### 3. Verify Created Files

Check that the CLI tool created `hello.cpp` on your filesystem:

```bash
cat hello.cpp
```

### Expected `hello.cpp` Content

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

---

## 🎉 Conclusion

Congratulations! You have successfully built a complete, production-grade **Autonomous ReAct Agent SDK** with Node.js, TypeScript ESM, OpenAI GPT-4o, dynamic JSON step pipelines, custom tool execution, and real-time interceptors!
