# Chapter 1 — System Prompt Engineering & Pipeline Harness

## 1. Chapter Goal

The goal of this chapter is to implement the core **System Harness Prompt** (`HARNESS_PROMPT`) in `src/app/config.ts`.

In standard LLM completions, models produce unstructured free-form text. For an autonomous agent to reliably make decisions, trigger external tools, analyze results, and maintain state control, the LLM must be constrained by a strict cognitive pipeline using structured JSON output.

In this chapter, we:
* Define the 5-stage cognitive pipeline (`INITIAL`, `THINK`, `TOOL_REQUEST`, `ANALYSE`, `OUTPUT`)
* Specify JSON output schemas for model compliance
* Provide shot examples (few-shot prompting) to guide model reasoning
* Create the `src/app/config.ts` module

---

### 🎯 Expected Outcome

By the end of this chapter, `src/app/config.ts` will export a complete `HARNESS_PROMPT` string that enforces structured step reasoning for the Agent framework.

```text
src/app/config.ts
    │
    └── export const HARNESS_PROMPT = `...`
```

---

## 2. The Cognitive Pipeline Architecture

The **ReAct (Reasoning + Acting)** paradigm requires breaking down user queries into explicit operational steps:

```text
+-----------------------------------------------------------------------------------+
|                                COGNITIVE PIPELINE                                 |
+-----------------------------------------------------------------------------------+
|  1. INITIAL      --> Intention analysis & understanding of user request           |
|  2. THINK        --> Problem decomposition & strategy creation                    |
|  3. TOOL_REQUEST --> Dispatch call to registered external tool                    |
|  4. ANALYSE      --> Evaluate tool response or interim calculation                |
|  5. OUTPUT       --> Deliver final structured answer to user (Exit Condition)    |
+-----------------------------------------------------------------------------------+
```

### Pipeline State Transition Rules

1. **`INITIAL`**: Triggered first when a user submits a query. The agent states its high-level goal.
2. **`THINK`**: Used for problem decomposition, mathematical calculations, logic breakdown, or deciding which tool to invoke.
3. **`TOOL_REQUEST`**: Used when the agent needs information from an external tool. The model outputs the function name and argument string in JSON format.
4. **`ANALYSE`**: Used after receiving tool output or completing a intermediate thought, evaluating whether the problem is solved.
5. **`OUTPUT`**: Emitted when the solution is complete. Emitting `OUTPUT` signals the `Agent` loop to terminate and return the trajectory to the user.

---

## 3. Implementation of `src/app/config.ts`

### File Path

```text
agent-sdk-sir/src/app/config.ts
```

### Code

```typescript
export const HARNESS_PROMPT = `
    You are an expert AI assistant.

    You have to analyse the user's input carefully and then you need to
    breakdown the problem into multiple sub problems before comming on to the final result.

    Always breakdown the users intention and how to solve that problem and then step by step solve it.

    We are going to follow a pipeline of "INITAL", "THINK", "TOOL_REQUEST", "ANALYSE" and "OUTPUT" pipline.

    The Pipeline:
    - "INITAL" When user gives an input, we will have an inital thought process on what this user is trying to do.
    - "THINK" this is where we are going to think about how to solve this and then start to breakdown the problem
    - "ANALYSE" this is where we will analyse the solution and also verify if the output is correct
    - "THINK" we can go back to think mode where we now see if any sub problem remanins and think
    - "ANALYSE" again analyse the problem and get onto a solution
    - "TOOL_REQUEST": use this for calling or requesting a tool. The format of output would be
        { "step": "TOOL_REQUEST", functionName: "getWeatherData", "input": "Goa" }
    - "OUTPUT" this is where we can end and give the final output to the user.

    Rules:
    - Always output one step at a time and wait for other step before proceeding.
    - Always maintain the sequence of pipeline as given in example
    - Always follow JSON output format strictly.

    Example:
  - "USER": What is 2 + 2 - 5 * 10 / 3?
    OUTPUT:
    - "INITAL": "The user wants me to solve a maths equation"
    - "THINK": "I will use the BODMAS formula and based on that I should firt multiple 5 * 10 which is 50"
    - "ANALYSE": "Yes, the bodmas is actaully right and now equation is 2 + 2 - 50 / 3"
    - "THINK": "Now as per rule I should perform divide which is dividing 50 / 3 which is 16.666667"
    - "ANALYSE": "Now the new equations remains 2 + 2 - 16.666667"
    - "THINK": "Now its simple we can just do 2 + 2 = 4 and new equation remains 4 - 16.6666667"
    - "ANALYSE": "Great, now lets just do the final step as simple subtraction"
    - "THINK": "After the final subtraction the ans remations -12.666667"
    - "OUTPUT": "The final output is "-12.666667"

    Example:
    - "USER" what is weather of Goa?
    OUTPUT:
   - "INITAL": "The user wants me to fetch weather information of Goa",
   - "THINK": "From the tools I can see we have a tool named getWeatherData which can be called"
   - "ANALYSE": "We are going right we can call getWeatherData with "GOA" as input"
   - "TOOL_REQUEST": { "functionName": "getWeatherData", "input": "goa" }
   - "TOOL_OUTPUT": The weather of Goa is sunny with some 30 degree c.
   - "THINK": "We got the weather info"
   - "OUTPUT": "The weather of Goa is sunny with some 30 degree c. Its goona be Hot"

   Output Format:
  { "step": "INITAL" | "THINK" | "TOOL_REQUEST |"ANALYSE" | "OUTPUT", "text": "<The Actual Text>", "functionName": "<NAME OF FUNCTION>", "input": "INPUT PARAMS of Function" }
`;
```

---

## 4. Deep Dive into Output Schema & JSON Rules

The prompt mandates that every LLM completion adheres strictly to the following JSON structure:

```json
{
  "step": "INITAL" | "THINK" | "TOOL_REQUEST" | "ANALYSE" | "OUTPUT",
  "text": "Human-readable explanation of current step",
  "functionName": "nameOfFunctionToCall",
  "input": "parameter payload passed to tool executor"
}
```

### Property Purpose Table

| Property | Type | Description |
| :--- | :--- | :--- |
| `step` | `string` | Current step identifier enum. Tells the Agent loop how to route state. |
| `text` | `string` | Reasoning explanation for logging and auditing. |
| `functionName` | `string` | Optional name of target tool when `step === "TOOL_REQUEST"`. |
| `input` | `string` | Arguments passed to the target tool executor function. |

---

## 5. Verification & Testing

To verify that `src/app/config.ts` compiles cleanly and can be imported:

### Run Type Checker

```bash
npx tsc --noEmit
```

### Node.js REPL Inspection

Validate importing `HARNESS_PROMPT` in Node.js ESM:

```bash
npx tsx -e "import { HARNESS_PROMPT } from './src/app/config.js'; console.log('Length:', HARNESS_PROMPT.length);"
```

### Expected Output

```text
Length: 2998
```

With `HARNESS_PROMPT` established, move to **Chapter 2** to define the Agent interfaces and the `AgentBuilder` pattern.
