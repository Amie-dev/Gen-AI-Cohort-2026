# Chapter 2 — Database Foundation (PostgreSQL + Prisma)

## 1. Goal & Outcome
- **Goal**: Connect PostgreSQL using Prisma ORM with pgvector support, set up core auth models (`User`, `Session`, `Account`, `Verification`), and create a clean Prisma Client singleton instance in the server.
- **Student Outcome**: Run database migrations via Prisma, generate the Prisma Client, and establish a verified database connection.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── prisma.config.ts
├── prisma/
│   └── schema.prisma     ← Data models schema
└── src/
    └── lib/
        └── db.ts         ← Singleton Prisma Client
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
# Install Prisma Client and PG driver adapter
npm install @prisma/client @prisma/adapter-pg pg

# Install Prisma CLI as dev dependency
npm install -D prisma @types/pg
```

### C. Prisma Schema (`server/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}
```

### D. Prisma Config (`server/prisma.config.ts`)
```typescript
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
```

### E. Prisma Client Instance (`server/src/lib/db.ts`)
```typescript
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db = new PrismaClient({ adapter });
```

---

## 3. Environment Configuration

Add `DATABASE_URL` to `server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/chaibook?schema=public"
```

---

## 4. Update Package Scripts (`server/package.json`)
Update `"dev"` script to auto-generate Prisma Client before starting server:
```json
{
  "scripts": {
    "dev": "prisma generate && tsx watch src/index.ts",
    "build": "prisma generate && tsc",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## 5. Verification & Commands Workflow

1. **Start PostgreSQL Container**:
   ```bash
   cd week05/chaibook-llm-sir
   docker compose up -d
   ```

2. **Run Prisma Migration**:
   ```bash
   cd server
   npx prisma migrate dev --name init_auth_models
   ```
   This compiles `schema.prisma`, creates SQL tables in PostgreSQL, and generates types.

3. **Verify Database with Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   Open `http://localhost:5555` to view database tables (`users`, `sessions`, `accounts`, `verifications`).
