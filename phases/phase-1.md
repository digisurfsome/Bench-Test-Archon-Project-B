# Phase 1: Foundation

> **Mechanisms:** mech_001 (Project Scaffolding), mech_002 (Database Schema & Persistence), mech_011 (Input Validation & Error Handling), mech_010 (Responsive UI Shell), mech_003 (User Authentication)
> **Estimated tokens:** 105,000 content + 25,000 overhead
> **Dependencies:** None (first phase)

---

## 1. Build Rules Preamble

### Core Engineering Rules

You are building Phase 1 of a Team Task Manager — a benchmark-quality full-stack web app. This phase establishes the complete foundation: monorepo scaffolding, database schema, validation layer, responsive UI shell, and user authentication.

**Architecture:**
- React 18 + TypeScript + Vite + Tailwind CSS (frontend, in `client/`)
- Node.js + Express + TypeScript (backend, in `server/`)
- SQLite via Prisma ORM (database)
- JWT + bcrypt (authentication)
- Zod (input validation)

**Mandatory Patterns:**
1. **Single responsibility per file/component.** One module = one concern.
2. **Service layer access only.** Routes call services. Services call Prisma. Routes NEVER call Prisma directly.
3. **Boundary validation at every entry point.** All API route handlers validate input via Zod schemas before passing to services.
4. **Separation of concerns:** `routes/` (HTTP handling) → `services/` (business logic) → `lib/prisma.ts` (data access).
5. **TypeScript strict mode.** No `any` types. All interfaces/types in dedicated type files.
6. **Error responses use proper HTTP status codes:** 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (conflict), 500 (server error).

**Forbidden Patterns:**
1. **NO direct Prisma calls from route handlers.** Always go through a service.
2. **NO `any` types.** Use proper TypeScript interfaces.
3. **NO inline type definitions in components.** Types go in `client/src/lib/types.ts`.
4. **NO API fetch calls inside components.** All API calls go through `client/src/lib/api.ts`.
5. **NO hardcoded secrets.** JWT secret and database URL come from `.env`.
6. **NO console.log for error handling.** Use structured error responses.
7. **NO default exports for services/utilities.** Use named exports. Default exports only for React page components.

**Required Patterns:**
1. Prisma client as a singleton in `server/src/lib/prisma.ts`.
2. Auth middleware extracts JWT from `Authorization: Bearer <token>` header.
3. Zod schemas defined in `server/src/lib/validation.ts` and imported by routes.
4. React Router for client-side routing.
5. AuthContext provider wrapping the app for auth state management.
6. Tailwind CSS with mobile-first responsive design (375px minimum).
7. Vite proxy config to forward `/api` requests to Express backend.

---

## 2. File Sandbox Declaration

### files_allowed (you MAY create or modify these files)
```
package.json
package-lock.json
tsconfig.json
.env
.gitignore
prisma/schema.prisma
prisma/migrations/**
server/package.json
server/tsconfig.json
server/src/index.ts
server/src/lib/prisma.ts
server/src/lib/validation.ts
server/src/services/auth.service.ts
server/src/middleware/auth.ts
server/src/routes/auth.ts
client/package.json
client/tsconfig.json
client/vite.config.ts
client/index.html
client/tailwind.config.ts
client/postcss.config.js
client/src/main.tsx
client/src/main.css
client/src/App.tsx
client/src/lib/api.ts
client/src/lib/types.ts
client/src/context/AuthContext.tsx
client/src/pages/LoginPage.tsx
client/src/pages/RegisterPage.tsx
client/src/components/layout/AppShell.tsx
```

### files_read_only (you may READ but NOT modify)
```
(none — Phase 1 is the first phase)
```

### files_forbidden (do NOT touch under any circumstances)
```
* (everything not in files_allowed)
CLAUDE.md
BUILD_RULES.md
```

---

## 3. Build Order with Pulse Points

Build files in this exact order. After each file marked with **[PULSE]**, run the verification check listed.

| Order | File | Layer | Rationale |
|-------|------|-------|-----------|
| 1 | `package.json` | core_logic | Root project config — everything depends on this |
| 2 | `tsconfig.json` | core_logic | Shared TypeScript config base |
| 3 | `server/tsconfig.json` | core_logic | Server-specific TS config extending root |
| 4 | `client/tsconfig.json` | core_logic | Client-specific TS config extending root |
| 5 | `.env` | core_logic | DATABASE_URL and JWT_SECRET environment variables |
| 6 | `prisma/schema.prisma` | core_logic | All 4 models, 3 enums, relations |
| 7 | `server/src/lib/prisma.ts` | core_logic | Prisma client singleton |
| 8 | `server/src/lib/validation.ts` | core_logic | Zod schemas for auth endpoints |
| 9 | `server/src/services/auth.service.ts` | core_logic | Registration, login, token verification |
| 10 | `server/src/middleware/auth.ts` | core_logic | JWT verification middleware |
| 11 | `server/src/routes/auth.ts` | integration | Auth API endpoints |
| 12 | `server/src/index.ts` | integration | Express app setup and route mounting |
| 13 | `client/index.html` | ui_components | HTML entry point for Vite |
| 14 | `client/vite.config.ts` | ui_components | Vite config with React plugin and API proxy |
| 15 | `client/src/main.tsx` | ui_components | React DOM render entry point |
| 16 | `client/src/lib/api.ts` | state_management | Fetch wrapper and auth API functions |
| 17 | `client/src/lib/types.ts` | state_management | Shared TypeScript interfaces |
| 18 | `client/src/context/AuthContext.tsx` | state_management | Auth state provider |
| 19 | `client/src/App.tsx` | ui_components | App shell with routing |
| 20 | `client/src/pages/LoginPage.tsx` | ui_components | Login form page |
| 21 | `client/src/pages/RegisterPage.tsx` | ui_components | Registration form page |
| 22 | `client/src/components/layout/AppShell.tsx` | ui_components | Responsive layout wrapper |

### Pulse Checks

**After `package.json` [PULSE mech_001_step_01]:**
- [ ] File exists at `package.json`
- [ ] Is valid JSON
- [ ] Contains `name`, `scripts`, and `type` fields

**After `tsconfig.json` [PULSE mech_001_step_03]:**
- [ ] File exists at `tsconfig.json`
- [ ] Is valid JSON (jsonc)
- [ ] `compilerOptions` includes `strict: true`

**After `server/tsconfig.json` [PULSE mech_001_step_03]:**
- [ ] File exists at `server/tsconfig.json`
- [ ] Extends root tsconfig

**After `client/tsconfig.json` [PULSE mech_001_step_03]:**
- [ ] File exists at `client/tsconfig.json`
- [ ] Extends root tsconfig

**After `.env` [PULSE mech_002_step_03]:**
- [ ] File exists at `.env`
- [ ] Contains `DATABASE_URL`
- [ ] Contains `JWT_SECRET`

**After `prisma/schema.prisma` [PULSE mech_002_step_08]:**
- [ ] File exists at `prisma/schema.prisma`
- [ ] Contains `model User`
- [ ] Contains `model Team`
- [ ] Contains `model TeamMember`
- [ ] Contains `model Task`
- [ ] Contains `enum Status` with TODO, IN_PROGRESS, REVIEW, DONE
- [ ] Contains `enum Priority` with LOW, MEDIUM, HIGH, URGENT
- [ ] Contains `enum Role` with OWNER, MEMBER
- [ ] `npx prisma validate` passes

**After `server/src/lib/prisma.ts` [PULSE mech_002_step_11]:**
- [ ] File exists at `server/src/lib/prisma.ts`
- [ ] Exports PrismaClient instance (default or named export `prisma`)

**After `server/src/lib/validation.ts` [PULSE mech_011_step_01]:**
- [ ] File exists at `server/src/lib/validation.ts`
- [ ] Exports Zod schemas for registration (`registerSchema` or similar)
- [ ] Exports Zod schemas for login (`loginSchema` or similar)
- [ ] No `any` types

**After `server/src/services/auth.service.ts` [PULSE mech_003_step_04]:**
- [ ] File exists at `server/src/services/auth.service.ts`
- [ ] Exports `register` function
- [ ] Exports `login` function
- [ ] Imports bcrypt for password hashing
- [ ] Imports jsonwebtoken for JWT issuance

**After `server/src/middleware/auth.ts` [PULSE mech_003_step_12]:**
- [ ] File exists at `server/src/middleware/auth.ts`
- [ ] Exports auth middleware function
- [ ] Extracts Bearer token from Authorization header
- [ ] Calls `jwt.verify`

**After `server/src/routes/auth.ts` [PULSE mech_003_step_06]:**
- [ ] File exists at `server/src/routes/auth.ts`
- [ ] Exports Express Router
- [ ] Defines POST `/register` route
- [ ] Defines POST `/login` route
- [ ] Defines GET `/me` route with auth middleware

**After `server/src/index.ts` [PULSE mech_001_step_06]:**
- [ ] File exists at `server/src/index.ts`
- [ ] Imports and uses cors middleware
- [ ] Imports and uses `express.json()` middleware
- [ ] Mounts auth router at `/auth` or `/api/auth`
- [ ] Calls `app.listen`

**After `client/index.html` [PULSE mech_001_step_05]:**
- [ ] File exists at `client/index.html`
- [ ] Contains `<div id="root">`
- [ ] Contains `<script>` tag pointing to `src/main.tsx`

**After `client/vite.config.ts` [PULSE mech_001_step_05]:**
- [ ] File exists at `client/vite.config.ts`
- [ ] Imports `@vitejs/plugin-react`
- [ ] Configures proxy for `/api` to Express backend

**After `client/src/main.tsx` [PULSE mech_001_step_05]:**
- [ ] File exists at `client/src/main.tsx`
- [ ] Calls `ReactDOM.createRoot` or `createRoot`
- [ ] Renders App component

**After `client/src/lib/api.ts` [PULSE mech_003_step_06]:**
- [ ] File exists at `client/src/lib/api.ts`
- [ ] Exports `login` API function
- [ ] Exports `register` API function
- [ ] Includes Authorization header attachment for authenticated requests

**After `client/src/lib/types.ts` [PULSE mech_004_step_01]:**
- [ ] File exists at `client/src/lib/types.ts`
- [ ] Exports `User` interface/type
- [ ] Exports `Task` interface/type
- [ ] Exports `Team` interface/type
- [ ] No `any` types

**After `client/src/context/AuthContext.tsx` [PULSE mech_003_step_14]:**
- [ ] File exists at `client/src/context/AuthContext.tsx`
- [ ] Exports `AuthProvider` component
- [ ] Exports `useAuth` hook or AuthContext
- [ ] Manages JWT token in state
- [ ] Provides login and logout functions

**After `client/src/App.tsx` [PULSE mech_010_step_01]:**
- [ ] File exists at `client/src/App.tsx`
- [ ] Exports default App component
- [ ] Includes routing (react-router-dom or equivalent)
- [ ] Wraps content in AuthProvider

**After `client/src/pages/LoginPage.tsx` [PULSE mech_003_step_07]:**
- [ ] File exists at `client/src/pages/LoginPage.tsx`
- [ ] Exports default component
- [ ] Renders email and password input fields
- [ ] Calls login API on submit

**After `client/src/pages/RegisterPage.tsx` [PULSE mech_003_step_01]:**
- [ ] File exists at `client/src/pages/RegisterPage.tsx`
- [ ] Exports default component
- [ ] Renders name, email, and password input fields
- [ ] Calls register API on submit

**After `client/src/components/layout/AppShell.tsx` [PULSE mech_010_step_01]:**
- [ ] File exists at `client/src/components/layout/AppShell.tsx`
- [ ] Exports AppShell or default layout component
- [ ] Uses Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- [ ] Contains navigation elements

---

## 4. Seam Check Definitions

After all files are built, verify these cross-file connections:

| Provider | Consumer | Validates |
|----------|----------|-----------|
| `server/src/lib/prisma.ts` | `server/src/services/auth.service.ts` | prisma client import resolves; auth.service uses `prisma.user.create` and `prisma.user.findUnique` |
| `server/src/lib/validation.ts` | `server/src/routes/auth.ts` | `registerSchema` and `loginSchema` imports resolve; schemas used for request body validation |
| `server/src/services/auth.service.ts` | `server/src/routes/auth.ts` | `register` and `login` function imports resolve; return types match route response expectations |
| `server/src/middleware/auth.ts` | `server/src/routes/auth.ts` | auth middleware import resolves; middleware applied to GET `/me` route |
| `server/src/routes/auth.ts` | `server/src/index.ts` | auth router import resolves; mounted at correct path prefix |
| `client/src/context/AuthContext.tsx` | `client/src/App.tsx` | AuthProvider import resolves; wraps app routing tree |
| `client/src/lib/api.ts` | `client/src/context/AuthContext.tsx` | login/register API functions imported and called within auth context |
| `client/src/lib/types.ts` | `client/src/lib/api.ts` | User type import resolves; used as return type for auth API functions |

---

## 5. Objective and Feature Requirements

### What This Phase Builds

**Project Scaffolding (mech_001):**
- Monorepo with `client/` (Vite + React 18) and `server/` (Express + TypeScript)
- Shared root `tsconfig.json` with strict mode, extended by client and server
- Root `package.json` with `dev` script using `concurrently` to run both servers
- Vite configured with React plugin and API proxy to Express
- Express entry point with cors, json middleware, and health check

**Database Schema & Persistence (mech_002):**
- Prisma initialized with SQLite provider (`file:./dev.db`)
- 4 models: User (id, email unique, name, password, createdAt, updatedAt), Team (id, name, createdAt, updatedAt), TeamMember (id, userId, teamId, role, unique on [userId,teamId]), Task (id, title, description, status, priority, dueDate, assigneeId, teamId, createdAt, updatedAt)
- 3 enums: Status (TODO, IN_PROGRESS, REVIEW, DONE), Priority (LOW, MEDIUM, HIGH, URGENT), Role (OWNER, MEMBER)
- Migration generated and applied; Prisma client generated

**Input Validation & Error Handling (mech_011):**
- Zod schemas for registration (email, name, password) and login (email, password)
- Validation used in auth route handlers
- Structured error responses with proper status codes

**Responsive UI Shell (mech_010):**
- AppShell component with responsive navigation (375px mobile + desktop)
- Tailwind CSS configured with mobile-first responsive classes
- Layout wrapper for all authenticated pages

**User Authentication (mech_003):**
- POST `/auth/register`: validate input → check email uniqueness → bcrypt hash password → store user → return JWT (201)
- POST `/auth/login`: validate input → find user by email → bcrypt compare → return JWT (200) or 401
- GET `/auth/me`: auth middleware → return current user from JWT payload
- Auth middleware: extract Bearer token → jwt.verify → attach userId to request → 401 on failure
- React AuthContext: store JWT in state/localStorage, provide login/logout functions, protect routes
- Login and Register page components with forms

---

## 6. Pattern References

### Wall Classifications (must be exactly right — no flexibility)

| Step | Classification | File(s) | Verification Method |
|------|---------------|---------|-------------------|
| mech_001_step_01 | WALL | `package.json` | `package.json` exists, valid JSON, has name/scripts/type fields |
| mech_001_step_02 | WALL | directory structure | `client/src` and `server/src` directories exist |
| mech_001_step_03 | WALL | `tsconfig.json`, `server/tsconfig.json`, `client/tsconfig.json` | `tsc --noEmit` succeeds with zero errors on both client and server |
| mech_001_step_04 | WALL | `package.json` (deps) | `npm ls` exits with code 0 |
| mech_001_step_05 | WALL | `client/vite.config.ts`, `client/index.html` | Vite config parses; dev server starts and serves index.html |
| mech_001_step_06 | WALL | `server/src/index.ts` | Express starts; responds to GET /health |
| mech_001_step_07 | WALL | `package.json` (dev script) | `npm run dev` starts both servers via concurrently |
| mech_002_step_01-03 | WALL | `prisma/schema.prisma`, `.env` | `npx prisma validate` passes; `.env` has DATABASE_URL |
| mech_002_step_04-08 | WALL | `prisma/schema.prisma` | All 4 models + 3 enums defined; `npx prisma validate` passes |
| mech_002_step_09-11 | WALL | `prisma/migrations/`, `dev.db` | Migration applied; Prisma client importable with typed models |
| mech_011_step_01 | WALL | `server/src/lib/validation.ts` | Zod schemas export; no `any` types; schemas validate correct/incorrect payloads |
| mech_003_step_01-06 | WALL | `server/src/services/auth.service.ts`, `server/src/routes/auth.ts` | POST /auth/register returns 201 + JWT; password is bcrypt hashed |
| mech_003_step_07-11 | WALL | `server/src/services/auth.service.ts`, `server/src/routes/auth.ts` | POST /auth/login returns 200 + JWT for valid creds, 401 for invalid |
| mech_003_step_12 | WALL | `server/src/middleware/auth.ts` | GET /auth/me with JWT returns user; without JWT returns 401 |
| mech_010_step_01 | WALL | `client/src/components/layout/AppShell.tsx`, `client/src/App.tsx` | Responsive classes present; routing works; AuthProvider wraps tree |

### Door Classifications (constrained but flexible implementation)

| Step | Classification | File(s) | Constraints |
|------|---------------|---------|-------------|
| mech_003_step_14 | DOOR | `client/src/context/AuthContext.tsx` | Must provide login/logout/user state. Implementation (Context API vs Zustand vs custom hook) is flexible. Must store JWT. |
| mech_010_step_01 | DOOR | `client/src/components/layout/AppShell.tsx` | Must be responsive from 375px. Navigation structure (sidebar vs header) is flexible. Must use Tailwind. |

### Room Classifications (open implementation space)

| Step | Classification | File(s) | Boundaries |
|------|---------------|---------|------------|
| Login/Register UI | ROOM | `client/src/pages/LoginPage.tsx`, `client/src/pages/RegisterPage.tsx` | Must have correct input fields and call correct API. Visual design, layout, UX flow are open. Stay within Tailwind. |
| API client structure | ROOM | `client/src/lib/api.ts` | Must export named functions for login/register. Internal fetch wrapper pattern is open. Must attach auth headers. |

---

## 7. Violation Handling Instructions

| Severity | Trigger | Response |
|----------|---------|----------|
| **LOW** | Added or modified `client/src/lib/types.ts` beyond auth-related types | Log: types file may contain forward declarations for Phase 2 entities — acceptable if additive only |
| **MEDIUM** | Modified a Phase 2 or Phase 3 file (e.g., `task.service.ts`, `dashboard.ts`) | Review: if additive (stub/placeholder), proceed with caution. If substantive logic, revert the file. |
| **HIGH** | Deleted any existing file or removed exports from shared modules | Revert entire phase — deletion in foundation phase is destructive |
| **HIGH** | Modified `prisma/schema.prisma` in a way that drops columns or tables | Revert entire phase — schema must be additive |
| **CRITICAL** | Modified `.env` to remove DATABASE_URL or JWT_SECRET | FULL STOP — human review required. Environment variables are critical infrastructure. |
| **CRITICAL** | Modified `CLAUDE.md` or `BUILD_RULES.md` | FULL STOP — human review required. Build configuration files are immutable during build. |

---

## 8. Full Checkpoint at End

Run ALL FOUR STEPS after completing Phase 1. Every check must pass.

### Step 1: Pattern Check
```bash
git diff --name-only
```
Verify all changed files exist in the Phase 1 `files_allowed` list above. No file outside that list should appear.

### Step 2: Compile Check
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```
Zero TypeScript errors on both.

### Step 3: Schema Validation
```bash
npx prisma validate
npx prisma db push
```
Schema is valid and database syncs.

### Step 4: Functional Checks
- [ ] POST `/auth/register` with valid data returns 201 + JWT
- [ ] POST `/auth/login` with valid credentials returns 200 + JWT
- [ ] GET `/auth/me` with valid JWT returns user object
- [ ] GET `/auth/me` without JWT returns 401
- [ ] Vite dev server starts and serves `client/index.html`
- [ ] Express server starts and responds to health check

---

## 9. Gate Condition

**ALL FOUR STEPS MUST PASS BEFORE PROCEEDING TO PHASE 2.**

If any step fails:
1. Diagnose the specific failure
2. Fix only the failing component
3. Re-run ALL four steps (not just the one that failed)
4. If two fresh attempts both fail, STOP for human review (two-strike rule)
