# Phase 1: Foundation — Enriched with Implementation Intelligence

> **Mechanisms:** mech_001 (Project Scaffolding), mech_002 (Database Schema & Persistence), mech_011 (Input Validation & Error Handling), mech_010 (Responsive UI Shell), mech_003 (User Authentication)
> **Estimated tokens:** 105,000 content + 25,000 overhead
> **Dependencies:** None (first phase)
> **Enrichment source:** Greptacular React frontend patterns + BUILD_RULES.md canonical patterns

---

## Patterns to Mirror

### PATTERN 1: Prisma Client Singleton
**SOURCE:** BUILD_RULES.md:94-98 (canonical)
```typescript
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```
**Use in:** `server/src/lib/prisma.ts` — copy exactly. All services import from here. Never create additional instances.

### PATTERN 2: Zod Validation → Route Handler
**SOURCE:** BUILD_RULES.md:130-142 (canonical)
```typescript
// Route handler pattern
router.post('/', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues })
  }
  try {
    const result = await authService.register(parsed.data)
    res.status(201).json(result)
  } catch (error) {
    // Map service errors to HTTP responses
  }
})
```
**Use in:** `server/src/routes/auth.ts` — every route handler follows this exact flow: parse → service → respond.

### PATTERN 3: Service Layer Function Signature
**SOURCE:** BUILD_RULES.md:119-127 (canonical)
```typescript
// Service function pattern
export async function register(data: { email: string; name: string; password: string }) {
  // 1. Check uniqueness (prisma.user.findUnique)
  // 2. Hash password (bcrypt.hash)
  // 3. Create user (prisma.user.create)
  // 4. Generate JWT (jwt.sign)
  // 5. Return { user (no password), token }
}
```
**Use in:** `server/src/services/auth.service.ts` — business logic lives here, NOT in routes.

### PATTERN 4: Generic Fetch Wrapper (from Greptacular)
**SOURCE:** Greptacular `ui/src/lib/api.ts:110-132`
```typescript
const API_BASE = '/api'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}
```
**Use in:** `client/src/lib/api.ts` — adapt this pattern. Add auth header injection:
```typescript
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}
```

### PATTERN 5: Vite Proxy Config (from Greptacular)
**SOURCE:** Greptacular `ui/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
```
**Use in:** `client/vite.config.ts` — proxy both `/api` and `/auth` paths to Express backend.

---

## Mandatory Reading (Priority-Ordered)

### P0 — Must Read Before Writing Any Code
| File | Why |
|------|-----|
| `CLAUDE.md` | Architecture, file structure, immutable rules |
| `BUILD_RULES.md` | Service layer pattern, error handling, test structure |
| This enriched phase file | Build order, patterns, gotchas |

### P1 — Read When Building Specific Files
| File | When |
|------|------|
| Prisma docs: SQLite setup | Before `prisma/schema.prisma` |
| Zod docs: safeParse | Before `server/src/lib/validation.ts` |
| jsonwebtoken docs: sign/verify | Before `server/src/services/auth.service.ts` |
| bcrypt docs: hash/compare | Before `server/src/services/auth.service.ts` |
| React Router v6 docs | Before `client/src/App.tsx` |

### P2 — Reference If Stuck
| File | For |
|------|-----|
| Greptacular `ui/src/lib/api.ts` | Fetch wrapper patterns |
| Greptacular `ui/src/lib/types.ts` | Type organization |
| Greptacular `ui/vite.config.ts` | Vite configuration |

---

## Per-File Implementation Details

### 1. `package.json` (Root)
```json
{
  "name": "team-task-manager",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npx tsx watch src/index.ts",
    "dev:client": "cd client && npx vite"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```
**Pattern:** Mirror standard monorepo root. `type: "module"` enables ESM.

### 2. `tsconfig.json` (Root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```
**WALL:** `strict: true` is mandatory. No `any` types anywhere.

### 3. `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Status {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Role {
  OWNER
  MEMBER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  teams     TeamMember[]
  tasks     Task[]     @relation("assignee")
}

model Team {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   TeamMember[]
  tasks     Task[]
}

model TeamMember {
  id     String @id @default(cuid())
  userId String
  teamId String
  role   Role
  user   User   @relation(fields: [userId], references: [id])
  team   Team   @relation(fields: [teamId], references: [id])
  @@unique([userId, teamId])
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      Status    @default(TODO)
  priority    Priority
  dueDate     DateTime?
  assigneeId  String?
  teamId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  assignee    User?     @relation("assignee", fields: [assigneeId], references: [id])
  team        Team      @relation(fields: [teamId], references: [id])
}
```
**WALL:** All 4 models + 3 enums. `npx prisma validate` must pass. This file is FROZEN after Phase 1.

### 4. `server/src/lib/validation.ts`
```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
```
**Pattern:** Named exports only. Phase 2 will ADD task/team schemas to this file.

### 5. `server/src/services/auth.service.ts`
**Pattern:** Follow SERVICE_LAYER pattern from BUILD_RULES.md.
- `register(data)`: findUnique email → if exists 409 → bcrypt.hash(password, 10) → prisma.user.create → jwt.sign → return { user (omit password), token }
- `login(data)`: findUnique email → if !found 401 → bcrypt.compare → if !match 401 → jwt.sign → return { user, token }
- `getMe(userId)`: findUnique by id → return user (omit password)
- **Never return password field.** Use Prisma `select` or destructure to omit.

### 6. `server/src/middleware/auth.ts`
```typescript
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = payload.userId  // Extend Express Request type
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```
**Gotcha:** You must extend the Express Request type. Add to a `types.d.ts` or use module augmentation:
```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
```

### 7. `server/src/index.ts`
```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use('/auth', authRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

export { app }  // Export for testing in Phase 3
```
**CRITICAL:** Export `app` for supertest. Phase 3 tests import it.

### 8. `client/src/context/AuthContext.tsx`
**Pattern:** Standard React Context + localStorage for JWT persistence.
- Store `token` and `user` in state
- On mount, check localStorage for existing token → fetch `/auth/me` to validate
- `login(email, password)` → call API → store token in localStorage + state
- `logout()` → clear localStorage + state
- Provide `{ user, token, login, logout, loading }` via context

### 9. `client/src/App.tsx`
**Pattern:** React Router v6 with AuthProvider wrapping.
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```
Phase 2 adds task/team routes. Phase 3 adds dashboard route.

### 10. `client/src/components/layout/AppShell.tsx`
**Pattern from Greptacular:** Responsive layout with Tailwind.
```tsx
// Responsive nav — sidebar on desktop, header on mobile
<div className="min-h-screen bg-background">
  <nav className="border-b border-border px-4 py-3 flex items-center justify-between">
    {/* Logo/title */}
    <h1 className="text-lg font-semibold">Team Task Manager</h1>
    {/* Nav links — hidden on mobile, visible on md+ */}
    <div className="hidden md:flex items-center gap-4">
      <Link to="/tasks">Tasks</Link>
      <Link to="/teams">Teams</Link>
      <Link to="/dashboard">Dashboard</Link>
    </div>
    {/* Mobile menu toggle */}
    <button className="md:hidden">Menu</button>
  </nav>
  <main className="max-w-5xl mx-auto px-4 py-6">
    <Outlet />
  </main>
</div>
```
**DOOR:** Navigation structure is flexible. Must use Tailwind responsive classes. Must work at 375px.

---

## Gotchas

1. **Prisma SQLite + ESM:** If using `"type": "module"` in root package.json, ensure Prisma client generation is compatible. You may need `"type": "commonjs"` in `server/package.json` or use `tsx` runner which handles both.

2. **Express Request type extension:** TypeScript won't know about `req.userId` unless you augment the Express types. Do this in a `.d.ts` file or at the top of `middleware/auth.ts`.

3. **bcrypt vs bcryptjs:** `bcrypt` requires native compilation (node-gyp). `bcryptjs` is pure JS, slower but zero setup issues. For a benchmark app, `bcryptjs` is safer — no build failures.

4. **JWT_SECRET in .env:** Must be a strong random string. Don't use "secret" or "password". Example: `JWT_SECRET=your-256-bit-secret-key-change-in-production`

5. **Vite proxy requires both `/api` and `/auth`:** If auth routes are at `/auth/*` (not `/api/auth/*`), the Vite proxy needs a separate entry for `/auth`.

6. **Prisma migration command:** After writing `schema.prisma`, run `npx prisma migrate dev --name init` to create the migration AND generate the client. `npx prisma db push` is an alternative that skips migration files.

7. **Export `app` from index.ts:** Phase 3 tests need to import the Express app for supertest. If you only call `app.listen()` without exporting, tests can't attach.

---

## Decision Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Package IDs (cuid vs uuid) | `@default(cuid())` | `@default(uuid())`, autoincrement int | cuid is URL-safe, shorter, Prisma's default recommendation for SQLite |
| Password hashing lib | bcryptjs (pure JS) | bcrypt (native), argon2 | Zero native compilation = no build failures on any OS |
| JWT payload shape | `{ userId: string }` | `{ userId, email, role }` | Minimal payload. Query user from DB when needed. Avoids stale data in token. |
| Auth route prefix | `/auth/*` | `/api/auth/*` | Matches PRD spec exactly. Vite proxy must handle both `/api` and `/auth`. |
| Server runner | tsx (watch mode) | ts-node, nodemon+tsc | tsx is fast, ESM-compatible, zero-config. `npx tsx watch src/index.ts` |
| Client routing | React Router v6 | TanStack Router, Wouter | Most established, largest ecosystem, matches React 18 best practices |
