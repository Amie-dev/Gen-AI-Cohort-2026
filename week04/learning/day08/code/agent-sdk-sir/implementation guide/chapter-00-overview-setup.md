
# Chapter 0 — Overview, Environment & Setup

## 1. Chapter Overview

Before we start building the **Agent SDK Framework**, we need a solid development environment.

In the upcoming chapters, we will build several important parts of an AI agent:

* Agent logic
* System and harness prompts
* Custom tools
* Tool handlers
* Agent execution loops
* OpenAI model integration
* Autonomous task execution

However, none of these should be our first step.

First, we need to make sure that **Node.js, TypeScript, and ECMAScript Modules (ESM)** are configured correctly.

This chapter prepares that foundation.

---

## 2. What We Are Building

Our project will use:

```text
Node.js
   │
   ├── TypeScript
   │
   ├── NodeNext ESM
   │
   ├── OpenAI SDK
   │
   └── Custom Agent Framework
```

### Why TypeScript?

JavaScript is flexible, but that flexibility can sometimes make large applications difficult to maintain.

TypeScript adds **static type checking**.

For example:

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

TypeScript knows that `a` and `b` must be numbers.

If we accidentally write:

```ts
add("10", 20);
```

TypeScript can detect the problem before the application runs.

For an Agent SDK framework, this becomes especially useful because our code will eventually contain:

* Agent configuration
* Tool definitions
* Tool inputs and outputs
* API responses
* Execution state
* Custom interfaces

Strong typing helps us keep these pieces predictable.

---

# 3. What Is ESM?

ESM stands for **ECMAScript Modules**.

It is the modern JavaScript module system based on:

```js
import
export
```

For example:

```ts
import OpenAI from "openai";
```

and:

```ts
export function createAgent() {
  // ...
}
```

Before ESM became widely used, Node.js applications commonly used **CommonJS**:

```js
const OpenAI = require("openai");
```

and:

```js
module.exports = createAgent;
```

For this project, we will use modern **ESM**.

---

# 4. Why Are We Using NodeNext?

Our TypeScript project uses:

```json
"module": "NodeNext"
```

`NodeNext` tells TypeScript:

> "Follow Node.js's modern module-resolution rules."

This is important because TypeScript itself does not execute our code.

The general flow is:

```text
TypeScript source
      │
      ▼
TypeScript compiler/runtime
      │
      ▼
JavaScript
      │
      ▼
Node.js
```

Node.js ultimately needs to understand how modules are loaded.

Using `NodeNext` makes TypeScript behave much more like modern Node.js.

---

# 5. Important: Why Do We Write `.js` in TypeScript Imports?

This is one of the most confusing parts of NodeNext ESM.

Suppose we have:

```text
src/
├── index.ts
└── app/
    └── agent.ts
```

You might expect to write:

```ts
import { Agent } from "./app/agent";
```

But with NodeNext ESM, we normally write:

```ts
import { Agent } from "./app/agent.js";
```

At first this looks strange because the actual file is:

```text
agent.ts
```

So why are we writing:

```text
agent.js
```

?

Because TypeScript is describing the **JavaScript file that will exist after compilation**.

For example:

```text
Before compilation:

src/app/agent.ts
        │
        ▼
TypeScript
        │
        ▼
After compilation:

dist/app/agent.js
```

Therefore, the import:

```ts
import { Agent } from "./app/agent.js";
```

matches the runtime JavaScript file:

```text
app/agent.js
```

### Remember this rule

When using NodeNext ESM:

```ts
// ✅ Recommended
import { Agent } from "./app/agent.js";
```

rather than:

```ts
// ❌ Usually incorrect for NodeNext ESM
import { Agent } from "./app/agent";
```

This is a runtime module-resolution requirement, not because your source file has suddenly become JavaScript.

---

# 6. Chapter Goals

In this chapter we will configure:

1. Project structure
2. `package.json`
3. ESM support
4. Node.js type definitions
5. TypeScript
6. NodeNext module resolution
7. Environment variables
8. Development execution with `tsx`
9. Type checking
10. Build configuration

---

# 7. Expected Project Structure

By the end of this chapter, our project should look approximately like this:

```text
agent-sdk-sir/
│
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
│
├── src/
│   ├── index.ts
│   │
│   └── app/
│       ├── agent.ts
│       └── config.ts
│
├── dist/
│   └── ...
│
└── implementation-guide/
    └── ...
```

### What does each directory mean?

| File / Directory        | Purpose                                |
| ----------------------- | -------------------------------------- |
| `package.json`          | Project metadata and dependencies      |
| `tsconfig.json`         | TypeScript configuration               |
| `.env`                  | Environment variables such as API keys |
| `.gitignore`            | Files Git should ignore                |
| `src/`                  | TypeScript source code                 |
| `src/index.ts`          | Application entry point                |
| `src/app/agent.ts`      | Agent engine and related interfaces    |
| `src/app/config.ts`     | Agent/system configuration             |
| `dist/`                 | Compiled JavaScript output             |
| `implementation-guide/` | Supporting documentation               |

---

# 8. Development Execution Flow

During development, we will usually start the application with:

```bash
npx tsx src/index.ts
```

The basic flow is:

```text
Developer
    │
    │
    ▼
src/index.ts
    │
    │
    ▼
tsx
    │
    ├── Executes TypeScript
    │
    ├── Resolves ESM imports
    │
    └── Runs the Node.js application
    │
    ▼
Agent Framework
    │
    ▼
OpenAI API
```

The important thing to understand is that `tsx` allows us to run TypeScript during development without manually compiling every time.

---

# 9. Project Prerequisites

Before starting, make sure you have:

* Node.js installed
* npm installed
* A working OpenAI API key
* A terminal
* A code editor such as VS Code

You can verify Node.js with:

```bash
node --version
```

and npm with:

```bash
npm --version
```

---

# 10. Navigate to the Project

Navigate to the project directory:

```bash
cd week04/learning/day08/code/agent-sdk-sir
```

If the directory does not exist yet, create it first:

```bash
mkdir -p week04/learning/day08/code/agent-sdk-sir
```

Then enter it:

```bash
cd week04/learning/day08/code/agent-sdk-sir
```

---

# 11. Initialize the Node.js Project

If `package.json` does not exist yet, initialize the project:

```bash
npm init -y
```

This creates:

```text
package.json
```

The `package.json` file is essentially the **identity and configuration file of a Node.js project**.

It stores information such as:

* Project name
* Version
* Dependencies
* Scripts
* Module configuration

---

# 12. Install Dependencies

Our application will use the following main libraries.

### Runtime dependencies

```bash
npm install openai axios
```

### Development dependencies

```bash
npm install -D typescript @types/node tsx
```

---

# 13. Understanding the Dependencies

Our dependency structure will look like:

```text
Dependencies
│
├── openai
│   └── OpenAI API SDK
│
└── axios
    └── HTTP client

DevDependencies
│
├── typescript
│   └── Type checking and compilation
│
├── @types/node
│   └── Node.js type definitions
│
└── tsx
    └── Run TypeScript directly during development
```

Let's understand each one.

---

## 13.1 `openai`

```bash
npm install openai
```

The `openai` package is the official OpenAI JavaScript/TypeScript SDK.

It allows our Node.js application to communicate with OpenAI APIs.

For example:

```ts
import OpenAI from "openai";

const client = new OpenAI();
```

Later, our agent framework will use this client to communicate with OpenAI models.

---

## 13.2 `axios`

```bash
npm install axios
```

Axios is an HTTP client.

It allows our application to communicate with external HTTP APIs.

For example:

```ts
import axios from "axios";

const response = await axios.get("https://example.com");
```

In our agent framework, this can be useful when a custom tool needs to call an external API.

For example:

```text
Agent
  │
  ▼
Custom Tool
  │
  ▼
Axios
  │
  ▼
External API
```

---

## 13.3 `typescript`

```bash
npm install -D typescript
```

TypeScript provides:

* Type checking
* TypeScript compilation
* TypeScript language support

For example:

```ts
const age: number = 25;
```

TypeScript knows that `age` must be a number.

---

## 13.4 `@types/node`

```bash
npm install -D @types/node
```

Node.js provides many built-in APIs.

For example:

```ts
import { exec } from "node:child_process";
```

TypeScript needs to know what `exec` is, what parameters it accepts, and what it returns.

`@types/node` provides those TypeScript definitions.

Without it, TypeScript may complain about Node.js-specific modules.

---

## 13.5 `tsx`

```bash
npm install -D tsx
```

`tsx` allows us to execute TypeScript files directly during development.

Instead of manually doing:

```text
TypeScript
   ↓
Compile
   ↓
JavaScript
   ↓
Node.js
```

we can simply run:

```bash
npx tsx src/index.ts
```

This makes development much faster.

---

# 14. Configure `package.json`

Our `package.json` should look similar to:

```json
{
  "name": "agent-sdk",
  "version": "1.0.0",
  "description": "Agent SDK Framework",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "axios": "^1.0.0",
    "openai": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^26.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

> The exact dependency versions may be different depending on when you install them. That is normal.

---

# 15. Understanding `package.json`

Let's break down the important parts.

## `"name"`

```json
"name": "agent-sdk"
```

This is the name of our Node.js project.

---

## `"version"`

```json
"version": "1.0.0"
```

This represents the current version of the project.

---

## `"type": "module"`

```json
"type": "module"
```

This is one of the most important settings in our project.

It tells Node.js:

> Treat JavaScript files in this package as ECMAScript Modules.

That means we can use:

```ts
import ...
```

and:

```ts
export ...
```

instead of the older CommonJS syntax:

```js
const something = require("something");
```

and:

```js
module.exports = something;
```

Our project therefore follows modern ESM conventions.

---

# 16. Understanding `scripts`

We define several useful scripts:

```json
"scripts": {
  "dev": "tsx src/index.ts",
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "start": "node dist/index.js"
}
```

### Development

```bash
npm run dev
```

Runs:

```bash
tsx src/index.ts
```

This is useful while actively developing the agent.

---

### Build

```bash
npm run build
```

Runs:

```bash
tsc
```

This compiles our TypeScript project into the `dist/` directory.

---

### Type checking

```bash
npm run typecheck
```

Runs:

```bash
tsc --noEmit
```

This checks for TypeScript errors without generating JavaScript files.

---

### Production/start

```bash
npm start
```

Runs:

```bash
node dist/index.js
```

This executes the compiled JavaScript.

---

# 17. Configure TypeScript

Create:

```text
tsconfig.json
```

Use:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",

    "module": "NodeNext",
    "target": "ESNext",

    "lib": ["ESNext"],
    "types": ["node"],

    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    "strict": true,

    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",

    "skipLibCheck": true
  }
}
```

> Notice that `"types"` appears only once. The original configuration contained both `"types": []` and `"types": ["node"]`; keeping both is unnecessary and confusing.

---

# 18. Understanding `rootDir`

```json
"rootDir": "./src"
```

This tells TypeScript that our source code lives inside:

```text
src/
```

For example:

```text
src/
├── index.ts
└── app/
    ├── agent.ts
    └── config.ts
```

These are our source files.

---

# 19. Understanding `outDir`

```json
"outDir": "./dist"
```

This tells TypeScript where to place compiled files.

For example:

```text
src/
└── index.ts
```

becomes approximately:

```text
dist/
└── index.js
```

Similarly:

```text
src/app/agent.ts
```

becomes:

```text
dist/app/agent.js
```

So we can think of:

```text
src/   →   source code
dist/  →   compiled code
```

---

# 20. Understanding `module: NodeNext`

```json
"module": "NodeNext"
```

This tells TypeScript to follow Node.js's modern module system and resolution rules.

It works together with:

```json
"type": "module"
```

in `package.json`.

Together, they establish our ESM environment.

```text
package.json
"type": "module"
        │
        ▼
Node.js uses ESM
        │
        ▲
        │
tsconfig.json
"module": "NodeNext"
```

This is why our project uses:

```ts
import ...
```

instead of:

```js
require(...)
```

---

# 21. Understanding `target: ESNext`

```json
"target": "ESNext"
```

This tells TypeScript to target a modern version of JavaScript.

In other words:

> Don't unnecessarily transform modern JavaScript features into older syntax.

Because we are targeting a modern Node.js runtime, using `ESNext` is appropriate for this project.

---

# 22. Understanding `lib`

```json
"lib": ["ESNext"]
```

This tells TypeScript which JavaScript APIs and language features should be available when checking our code.

For example, modern JavaScript features such as:

* `Promise`
* `Map`
* `Set`
* Modern array methods
* Other ES features

are included through the appropriate library definitions.

---

# 23. Understanding `types`

```json
"types": ["node"]
```

This tells TypeScript to include Node.js type definitions.

Because we installed:

```bash
npm install -D @types/node
```

TypeScript can understand Node.js APIs such as:

```ts
import { exec } from "node:child_process";
```

and:

```ts
process.env
```

---

# 24. Understanding `strict`

```json
"strict": true
```

This enables TypeScript's strict type-checking features.

For example:

```ts
function greet(name: string) {
  return `Hello ${name}`;
}
```

If we write:

```ts
greet(123);
```

TypeScript will report an error.

Strict mode is especially useful in an agent framework because agents contain many moving pieces:

```text
Agent
├── Configuration
├── Tools
├── Inputs
├── Outputs
├── API responses
├── Execution state
└── Errors
```

Strong type checking helps prevent many mistakes before runtime.

---

# 25. Understanding `verbatimModuleSyntax`

```json
"verbatimModuleSyntax": true
```

This tells TypeScript to preserve our import/export syntax more precisely.

It also makes the distinction between **type imports** and **runtime imports** explicit.

For example:

```ts
import type { AgentConfig } from "./types.js";
```

The `type` keyword tells TypeScript:

> This import is only needed for type checking. It does not need to exist at runtime.

This becomes particularly useful in larger TypeScript applications.

---

# 26. Understanding `isolatedModules`

```json
"isolatedModules": true
```

This ensures that each TypeScript file can be processed independently.

It helps catch patterns that may cause problems with tools that transform TypeScript files individually.

This is useful because our development workflow uses tools such as `tsx`.

---

# 27. Understanding `sourceMap`

```json
"sourceMap": true
```

Source maps help us debug the original TypeScript code even though Node.js eventually executes JavaScript.

For example:

```text
agent.ts
   │
   ▼
agent.js
   │
   ▼
Runtime error
```

Without source maps, debugging can point primarily to the generated JavaScript.

With source maps, debugging tools can map the location back to:

```text
agent.ts
```

which is much easier to understand.

---

# 28. Understanding Declaration Files

We have:

```json
"declaration": true
```

and:

```json
"declarationMap": true
```

These options allow TypeScript to generate declaration files such as:

```text
agent.d.ts
```

A `.d.ts` file describes the types exported by a JavaScript/TypeScript module.

For example, it can describe:

```ts
export declare function createAgent(): Agent;
```

This becomes useful when creating reusable libraries or frameworks.

---

# 29. Understanding Additional Safety Options

We also use:

```json
"noUncheckedIndexedAccess": true
```

This makes TypeScript more careful when accessing values by index.

For example:

```ts
const tools = ["search", "calculator"];

const tool = tools[10];
```

Without additional checking, it can be easy to assume `tool` exists.

With:

```json
"noUncheckedIndexedAccess": true
```

TypeScript can recognize that the result may be:

```ts
string | undefined
```

This encourages safer code.

---

We also use:

```json
"exactOptionalPropertyTypes": true
```

This makes optional object properties behave more precisely.

It helps distinguish between:

```ts
{
  name?: string
}
```

and explicitly providing:

```ts
{
  name: undefined
}
```

This is useful when designing strict configuration objects for agents and tools.

---

# 30. Why `skipLibCheck`?

```json
"skipLibCheck": true
```

This tells TypeScript not to deeply type-check declaration files from dependencies.

For example:

```text
node_modules/
    ├── openai/
    ├── axios/
    └── ...
```

This can significantly reduce unnecessary type-checking work while still checking our own application code.

---

# 31. Create the Source Directory

Create the application structure:

```bash
mkdir -p src/app
```

Now create:

```text
src/
├── index.ts
└── app/
    ├── agent.ts
    └── config.ts
```

You can create the files manually from your editor.

---

# 32. Understanding the Source Files

### `src/index.ts`

This will be our **entry point**.

Think of it as the starting point of the application.

```text
index.ts
   │
   ▼
Start application
   │
   ▼
Create/configure agent
   │
   ▼
Run agent
```

---

### `src/app/agent.ts`

This file will contain the main agent-related logic.

Eventually it may contain things such as:

* Agent interfaces
* Agent configuration
* Agent execution
* Tool handling
* Agent state

---

### `src/app/config.ts`

This file will contain configuration used by the agent.

For example:

* System/harness prompt
* Model configuration
* Agent behavior configuration

We will implement these pieces in later chapters.

---

# 33. Environment Variables

Our application will need an OpenAI API key.

We should **never hard-code an API key directly into source code**.

Avoid this:

```ts
const apiKey = "sk-xxxxxxxxxxxxxxxx";
```

Instead, use an environment variable.

For example:

```text
OPENAI_API_KEY=your_api_key_here
```

This can be stored in a `.env` file.

---

# 34. Create `.env`

Create:

```text
.env
```

Then add:

```env
OPENAI_API_KEY=your_api_key_here
```

Replace the placeholder with your actual API key.

### Important

Do not commit `.env` to Git.

Add it to `.gitignore`:

```gitignore
node_modules/
dist/
.env
```

This prevents your API key from accidentally being uploaded to GitHub.

---

# 35. How Environment Variables Work

The basic idea is:

```text
.env
 │
 │ OPENAI_API_KEY
 ▼
Node.js process
 │
 ▼
process.env.OPENAI_API_KEY
 │
 ▼
OpenAI SDK
```

In Node.js/TypeScript, we can access an environment variable through:

```ts
process.env.OPENAI_API_KEY
```

For example:

```ts
const apiKey = process.env.OPENAI_API_KEY;
```

Later, when we initialize the OpenAI client, the SDK can use this configuration.

---

# 36. Type Checking the Project

Before running the actual agent, we should verify that TypeScript understands our project.

Run:

```bash
npx tsc --noEmit
```

Or, if we added the npm script:

```bash
npm run typecheck
```

---

# 37. What Does `--noEmit` Mean?

Normally:

```bash
tsc
```

does two things:

```text
TypeScript
   │
   ├── Checks types
   │
   └── Generates JavaScript
```

But:

```bash
tsc --noEmit
```

only performs the checking:

```text
TypeScript
   │
   └── Type checking
```

It does **not** create files.

This makes it ideal for quickly checking whether the project contains TypeScript errors.

---

# 38. Expected Result

If everything is configured correctly:

```bash
npx tsc --noEmit
```

should finish without reporting errors.

For example:

```text
$ npx tsc --noEmit
$
```

A silent terminal generally means:

```text
No TypeScript errors detected.
```

If there is an error, TypeScript will show the file, line number, and problem.

For example:

```text
src/index.ts:5:10 - error TS2307:
Cannot find module './app/agent.js'
```

This information helps us locate the problem.

---

# 39. Build the Project

Once type checking succeeds, we can compile the project:

```bash
npm run build
```

This runs:

```bash
tsc
```

and creates the `dist/` directory.

The result should look approximately like:

```text
dist/
├── index.js
├── index.js.map
└── app/
    ├── agent.js
    └── config.js
```

Depending on the configuration and source files, additional `.d.ts` and source-map files may also be generated.

---

# 40. Run the Application

During development:

```bash
npm run dev
```

This runs:

```bash
tsx src/index.ts
```

After compiling:

```bash
npm start
```

This runs:

```bash
node dist/index.js
```

So we have two common workflows:

```text
Development
───────────

npm run dev
      │
      ▼
tsx src/index.ts
      │
      ▼
TypeScript application
```

and:

```text
Compiled application
────────────────────

npm run build
      │
      ▼
dist/
      │
      ▼
npm start
      │
      ▼
node dist/index.js
```

---

# 41. Complete Development Workflow

The complete setup workflow is:

```text
1. Create project
       │
       ▼
2. npm init
       │
       ▼
3. Install dependencies
       │
       ▼
4. Configure package.json
       │
       ▼
5. Configure tsconfig.json
       │
       ▼
6. Create src/ structure
       │
       ▼
7. Configure .env
       │
       ▼
8. Run TypeScript check
       │
       ▼
9. Build project
       │
       ▼
10. Run application
```

The commands are:

```bash
npm install
npm install openai axios
npm install -D typescript @types/node tsx

npm run typecheck

npm run build

npm run dev
```

---

# 42. Final Project Structure

At the end of this setup chapter, our project should look like:

```text
agent-sdk-sir/
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env
├── .gitignore
│
├── src/
│   ├── index.ts
│   │
│   └── app/
│       ├── agent.ts
│       └── config.ts
│
├── dist/
│   └── ...
│
└── implementation-guide/
    └── ...
```

---

# 43. Key Concepts to Remember

Before moving forward, make sure these concepts are clear.

### 1. TypeScript

TypeScript adds static typing to JavaScript.

```ts
const name: string = "Aminul";
```

---

### 2. ESM

ESM is the modern JavaScript module system.

```ts
import something from "something";
```

```ts
export function something() {}
```

---

### 3. `"type": "module"`

This tells Node.js that the project uses ESM.

```json
"type": "module"
```

---

### 4. `NodeNext`

This tells TypeScript to follow Node.js's modern module-resolution rules.

```json
"module": "NodeNext"
```

---

### 5. `.js` imports

With NodeNext ESM, local imports should generally include the `.js` extension:

```ts
import { Agent } from "./app/agent.js";
```

even though the source file is:

```text
agent.ts
```

---

### 6. `tsx`

`tsx` allows us to run TypeScript directly during development:

```bash
npx tsx src/index.ts
```

---

### 7. `@types/node`

Provides TypeScript definitions for Node.js APIs:

```ts
process
fs
path
child_process
```

and many others.

---

### 8. `tsc --noEmit`

Checks TypeScript without generating files:

```bash
npx tsc --noEmit
```

---

### 9. `dist`

Contains the compiled JavaScript output.

```text
src/  → TypeScript source
dist/ → compiled JavaScript
```

---

### 10. Environment Variables

Secrets such as API keys should be stored outside source code:

```env
OPENAI_API_KEY=...
```

and never committed to Git.

---

# 44. Chapter Completion Checklist

Before moving to Chapter 1, verify that:

* [ ] Node.js is installed
* [ ] npm is working
* [ ] `package.json` exists
* [ ] `"type": "module"` is configured
* [ ] `openai` is installed
* [ ] `axios` is installed
* [ ] `typescript` is installed
* [ ] `@types/node` is installed
* [ ] `tsx` is installed
* [ ] `tsconfig.json` exists
* [ ] `"module": "NodeNext"` is configured
* [ ] `"target": "ESNext"` is configured
* [ ] `"strict": true` is configured
* [ ] `src/app/` exists
* [ ] `.env` is configured
* [ ] `.env` is included in `.gitignore`
* [ ] `npx tsc --noEmit` succeeds
* [ ] `npm run build` succeeds
* [ ] `npm run dev` starts successfully

---

# 45. What's Next?

Our development foundation is now ready.

We have established:

```text
Node.js
   │
   ▼
TypeScript
   │
   ▼
NodeNext + ESM
   │
   ▼
OpenAI SDK
   │
   ▼
Agent Framework
```

However, we haven't built the actual agent yet.

In **Chapter 1**, we will start implementing one of the most important components of the framework:

> **The System Harness Prompt**

This is where we begin defining how our agent should behave, what rules it should follow, and how it should interact with tools and the execution environment.

