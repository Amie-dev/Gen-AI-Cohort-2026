# Chapter 3 — Authentication System (Better Auth + Google OAuth)

## 1. Goal & Outcome
- **Goal**: Implement complete authentication with Better Auth on the server (Google OAuth + Prisma adapter) and integrate it with Next.js on the client. Set up session management and protected route middleware.
- **Student Outcome**: Users can click "Sign in with Google", complete OAuth authentication, receive secure session cookies, and access authenticated backend API endpoints.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── .env
└── src/
    ├── index.ts                              ← Mount Better Auth handler BEFORE express.json()
    ├── lib/
    │   ├── auth.ts                           ← Better Auth configuration
    │   └── session.ts                        ← Session TypeScript interface
    └── middleware/
        └── require-auth.middleware.ts        ← Express auth middleware (req.session)
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
npm install better-auth @prisma/adapter-pg pg
```

### C. Server Code Implementation

#### 1. `server/src/lib/auth.ts`
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db.js";

const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? clientUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [clientUrl],
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

#### 2. `server/src/lib/session.ts`
```typescript
import type { auth } from "./auth.js";

export type Session = typeof auth.$Infer.Session;
```

#### 3. `server/src/middleware/require-auth.middleware.ts`
```typescript
import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { Session } from "../lib/session.js";

declare module "express-serve-static-core" {
  interface Request {
    session: Session;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  req.session = session;
  next();
}
```

#### 4. Mount Auth Handler in Entry (`server/src/index.ts`)
> **CRITICAL RULE**: Better Auth handler must be mounted **BEFORE** `express.json()` middleware so raw body parsing for auth requests is preserved.

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// Mount Better Auth endpoints under /api/auth/* BEFORE express.json()
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

// Protected route example
import { requireAuth } from "./middleware/require-auth.middleware.js";
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});
```

---

## 3. Client Implementation (`client/`)

### A. Folder & File Structure
```
client/
└── features/
    └── auth/
        ├── lib/
        │   └── auth-client.ts        ← Better Auth React Client instance
        ├── components/
        │   ├── login-form.tsx        ← Login UI component
        │   └── sign-out-button.tsx   ← Sign Out UI component
        └── hooks/
            └── use-session.ts        ← Auth Hook
```

### B. Installation Commands
From `week05/chaibook-llm-sir/client`:
```bash
npm install better-auth
```

### C. Client Code Implementation

#### 1. `client/features/auth/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8080",
});

export const { signIn, signOut, useSession } = authClient;
```

#### 2. `client/features/auth/components/login-form.tsx`
```tsx
"use client";

import { signIn } from "../lib/auth-client";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-xl max-w-sm mx-auto shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to access your Chaibook Workspaces</p>
      
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition"
      >
        <LogIn className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  );
}
```

---

## 4. Environment Setup (`server/.env`)

```env
BETTER_AUTH_SECRET=your_generated_random_secret_string_32_chars
BETTER_AUTH_URL=http://localhost:8080
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

---

## 5. Verification & Testing

1. Launch server & client (`npm run dev` in both directories).
2. Open `http://localhost:3000/login` (or mount `<LoginForm />`).
3. Click "Continue with Google".
4. After Google redirect, open developer tool cookies: verify `better-auth.session_token` cookie is present with `HttpOnly` and `SameSite`.
5. Call backend authenticated route: `curl -b "better-auth.session_token=..." http://localhost:8080/api/me`. Expected output: `{ "user": { "id": "...", "email": "..." } }`.
