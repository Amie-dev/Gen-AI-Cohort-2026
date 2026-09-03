# Chapter 1 — Project Bootstrap (Server & Client)

## 1. Goal & Outcome
- **Goal**: Bootstrap a production-ready Express + TypeScript backend server and Next.js frontend client with strict ESM support, CORS configuration, environment variables, and health check endpoints.
- **Student Outcome**: Both server (`http://localhost:8080/health`) and client (`http://localhost:3000`) can start cleanly in dev mode and communicate seamlessly.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── src/
    └── index.ts          ← Server entry point
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
# Initialize npm
npm init -y

# Core dependencies
npm install express dotenv cors

# Dev dependencies
npm install -D typescript tsx @types/node @types/express @types/cors
```

### C. Config Files

#### 1. `server/package.json`
```json
{
  "name": "server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/node": "^24.1.0",
    "tsx": "^4.20.3",
    "typescript": "^5.9.2"
  }
}
```

#### 2. `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
> **ESM Note**: With `"module": "NodeNext"` and `"type": "module"`, all relative imports in TypeScript source files must use explicit `.js` extensions (e.g., `import { db } from "./lib/db.js"`). TypeScript resolves this automatically at compile time.

#### 3. `server/.env` & `server/.env.example`
```env
PORT=8080
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### D. Server Entry Point (`server/src/index.ts`)
```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT ?? 8080;

// Middleware configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Basic health routes
app.get("/", (_req, res) => {
  res.json({ message: "Hello from Chaibook API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start listening
app.listen(port, () => {
  console.log(`[Chaibook Server] Running on http://localhost:${port}`);
});
```

---

## 3. Client Implementation (`client/`)

### A. Folder Structure
```
client/
├── package.json
├── tsconfig.json
├── next.config.ts
└── app/
    ├── layout.tsx
    ├── page.tsx
    └── globals.css
```

### B. Installation Commands
From `week05/chaibook-llm-sir/client`:
```bash
npm install next react react-dom lucide-react @tanstack/react-query
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss
```

### C. Client Base Setup

#### 1. `client/next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

#### 2. `client/app/page.tsx`
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-amber-500 mb-4">Chaibook LLM Sir</h1>
      <p className="text-slate-400 max-w-md text-center mb-8">
        Your AI-powered Notebook & RAG Workspace for active learning.
      </p>
      <a
        href="http://localhost:8080/health"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition"
      >
        Check Backend Health API
      </a>
    </main>
  );
}
```

---

## 4. Verification & Testing

1. **Run Server**:
   ```bash
   cd server
   npm run dev
   ```
   Expected console output: `[Chaibook Server] Running on http://localhost:8080`

2. **Verify Server Health**:
   ```bash
   curl http://localhost:8080/health
   # Expected JSON: {"status":"ok","timestamp":"..."}
   ```

3. **Run Client**:
   ```bash
   cd client
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
