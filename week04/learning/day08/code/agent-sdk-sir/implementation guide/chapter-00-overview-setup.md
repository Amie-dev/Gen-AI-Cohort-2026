# Chapter 0 — Overview, Environment & Setup

## 1. Chapter Goal

The goal of this chapter is to prepare the **Node.js + TypeScript (NodeNext ESM)** environment for the **Agent SDK Framework**.

Before writing the AI agent logic, harness system prompt, custom tool handlers, or the autonomous execution loop, we first need a robust TypeScript foundation configured for modern ECMAScript Modules (ESM).

In this chapter, we configure:

* Project directory structure
* `package.json` with ESM support (`"type": "module"`)
* Node.js runtime and dependency types (`@types/node`)
* `tsconfig.json` with NodeNext module resolution
* Environment variable configuration (`OPENAI_API_KEY`)
* Development build and verification workflows

---

### 🎯 Expected Outcome

By the end of this chapter, the project directory should be structured as follows:

```text
agent-sdk-sir/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── app/
│       ├── agent.ts
│       └── config.ts
└── implementation guide/
```

The execution flow for development works as follows:

```text
Developer
   │
   ▼
npx tsx src/index.ts
   │
   ├── Resolves NodeNext TypeScript imports (e.g. import from './app/agent.js')
   │
   └── Executes Agent SDK with OpenAI API
```

---

## 2. Project Prerequisites & Dependencies

Navigate to the project root directory:

```bash
cd week04/learning/day08/code/agent-sdk-sir
```

### Installing Dependencies

Install the project dependencies using `npm`:

```bash
npm install
```

To support full functionality across OpenAI model calls and HTTP requests for external tools, ensure the following core libraries are installed:

```bash
npm install openai axios
npm install -D typescript @types/node tsx
```

### Dependency Roles

```text
Dependencies
├── openai             --> Official SDK for interacting with GPT-4o models
├── axios              --> Promise-based HTTP client for external tool execution
└── DevDependencies
    ├── typescript     --> Static type checker & compiler
    ├── @types/node    --> Type definitions for Node.js standard modules (child_process, etc.)
    └── tsx            --> Fast TypeScript executor for ESM Node.js runtime
```

---

## 3. `package.json` Configuration

### File Path

```text
agent-sdk-sir/package.json
```

### Code

```json
{
  "name": "agent-sdk",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module",
  "devDependencies": {
    "@types/node": "^26.4.0"
  }
}
```

### Explanation of Critical Settings

1. **`"type": "module"`**: Tells Node.js to treat all `.js` files as ES Modules. This allows top-level `import` and `export` statements instead of CommonJS `require()`.
2. **`@types/node`**: Provides TypeScript definitions for Node.js built-in APIs, such as `child_process.exec` used by system tools.

---

## 4. `tsconfig.json` Configuration

### File Path

```text
agent-sdk-sir/tsconfig.json
```

### Code

```json
{
  // Visit https://aka.ms/tsconfig to read more about this file
  "compilerOptions": {
    // File Layout
    "rootDir": "./src",
    "outDir": "./dist",

    // Environment Settings
    // See also https://aka.ms/tsconfig/module
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    // For nodejs:
    "lib": ["esnext"],
    "types": ["node"],
    // and npm install -D @types/node

    // Other Outputs
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Style Options
    // "noImplicitReturns": true,
    // "noImplicitOverride": true,
    // "noUnusedLocals": true,
    // "noUnusedParameters": true,
    // "noFallthroughCasesInSwitch": true,
    // "noPropertyAccessFromIndexSignature": true,

    // Recommended Options
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
  }
}
```

### Key Compiler Option Breakdown

* **`"module": "nodenext"` & `"target": "esnext"`**: Enables native Node.js ESM resolution. When writing TypeScript import paths targeting local files, extensions must explicitly specify `.js` (e.g. `import { Agent } from './app/agent.js'`), matching Node's native ESM resolution algorithm.
* **`"rootDir": "./src"`**: Restricts TypeScript compiler input scope to the `src` directory.
* **`"outDir": "./dist"`**: Directs compiled JavaScript and declaration files into `dist/`.
* **`"strict": true`**: Enforces strict null checks, strict function types, and prevents implicit `any`.
* **`"verbatimModuleSyntax": true`**: Ensures import statements that only import type definitions are omitted during transpilation.

---

## 5. Directory Structure Setup

Create the source directory structure:

```bash
mkdir -p src/app
```

Verify that the project files are organized as follows:

```text
src/
├── app/
│   ├── agent.ts       # Agent Engine & Interfaces
│   └── config.ts      # System Harness Prompt
└── index.ts           # Demo entry point & tools
```

---

## 6. Verification & Setup Validation

To ensure your environment and TypeScript configuration are valid, perform the following step:

### Run TypeScript Type Check

```bash
npx tsc --noEmit
```

### Expected Terminal Output

If configured correctly with no syntax or import errors, `tsc --noEmit` will return silently with zero exit code:

```text
$ npx tsc --noEmit
(No errors reported)
```

Now that the TypeScript environment and ESM configuration are ready, proceed to **Chapter 1** to implement the System Harness Prompt.
