# Phase 2: Core Features

> **Mechanisms:** mech_004 (Task CRUD Operations), mech_005 (Team Management), mech_006 (Role-Based Authorization), mech_007 (Task Status Workflow)
> **Estimated tokens:** 105,000 content + 25,000 overhead
> **Dependencies:** Phase 1 (Foundation)

---

## 1. Build Rules Preamble

### Core Engineering Rules

You are building Phase 2 of a Team Task Manager. Phase 1 is complete — monorepo scaffolding, database schema, validation, responsive UI shell, and user authentication are all working. This phase adds the business logic core: task CRUD, team management, role-based authorization, and task status workflow.

**Architecture (established in Phase 1 — do not change):**
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
6. **Error responses use proper HTTP status codes:** 400 (validation/invalid transition), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (conflict), 500 (server error).
7. **Task status transitions are forward-only.** TODO→IN_PROGRESS→REVIEW→DONE. Invalid transitions return 400.
8. **Authorization middleware checks TeamMember.role.** OWNER can manage team members. MEMBER can CRUD tasks within their team.

**Forbidden Patterns:**
1. **NO direct Prisma calls from route handlers.** Always go through a service.
2. **NO `any` types.** Use proper TypeScript interfaces.
3. **NO modifying Phase 1 read-only files.** Schema, prisma client, auth middleware, auth service are frozen.
4. **NO backward status transitions.** The workflow is forward-only.
5. **NO authorization logic in route handlers.** Use middleware or service-layer checks.
6. **NO inline type definitions in components.** Types go in `client/src/lib/types.ts`.
7. **NO API fetch calls inside components.** All API calls go through `client/src/lib/api.ts`.

**Required Patterns:**
1. Task status transitions validated via `VALID_TRANSITIONS` map in `server/src/lib/workflow.ts`.
2. Authorization middleware in `server/src/middleware/authorization.ts` queries `TeamMember.role`.
3. Team creator is auto-assigned OWNER role on team creation.
4. All task and team routes protected by auth middleware from Phase 1.
5. Task CRUD operations scoped to user's team membership.
6. Zod schemas for task and team endpoints added to `server/src/lib/validation.ts`.
7. React hooks (`useTasks`, `useTeams`) for data fetching — no direct fetch in components.

---

## 2. File Sandbox Declaration

### files_allowed (you MAY create or modify these files)
```
server/src/lib/validation.ts
server/src/lib/workflow.ts
server/src/services/task.service.ts
server/src/services/team.service.ts
server/src/middleware/authorization.ts
server/src/routes/tasks.ts
server/src/routes/teams.ts
server/src/index.ts
client/src/lib/api.ts
client/src/lib/types.ts
client/src/hooks/useTasks.ts
client/src/hooks/useTeams.ts
client/src/pages/TaskListPage.tsx
client/src/pages/TaskFormPage.tsx
client/src/pages/TeamsPage.tsx
client/src/pages/TeamDetailPage.tsx
client/src/components/tasks/TaskCard.tsx
client/src/components/tasks/StatusBadge.tsx
client/src/components/teams/MemberList.tsx
client/src/App.tsx
```

### files_read_only (you may READ but NOT modify)
```
prisma/schema.prisma
server/src/lib/prisma.ts
server/src/middleware/auth.ts
server/src/services/auth.service.ts
client/src/context/AuthContext.tsx
client/src/components/layout/AppShell.tsx
```

### files_forbidden (do NOT touch under any circumstances)
```
* (everything not in files_allowed or files_read_only)
CLAUDE.md
BUILD_RULES.md
.env
```

---

## 3. Build Order with Pulse Points

Build files in this exact order. After each file marked with **[PULSE]**, run the verification check listed.

| Order | File | Layer | Rationale |
|-------|------|-------|-----------|
| 1 | `server/src/lib/validation.ts` | core_logic | Add Zod schemas for task and team endpoints |
| 2 | `server/src/lib/workflow.ts` | core_logic | VALID_TRANSITIONS map for task status state machine |
| 3 | `server/src/services/task.service.ts` | core_logic | Task CRUD business logic with status transition enforcement |
| 4 | `server/src/services/team.service.ts` | core_logic | Team creation, member management, membership queries |
| 5 | `server/src/middleware/authorization.ts` | core_logic | OWNER/MEMBER role checks |
| 6 | `server/src/routes/tasks.ts` | integration | Task CRUD endpoints with auth + authorization |
| 7 | `server/src/routes/teams.ts` | integration | Team CRUD + member management endpoints |
| 8 | `server/src/index.ts` | integration | Mount task and team routers |
| 9 | `client/src/lib/api.ts` | state_management | Add task and team API functions |
| 10 | `client/src/hooks/useTasks.ts` | state_management | Task data fetching and mutation hooks |
| 11 | `client/src/hooks/useTeams.ts` | state_management | Team data fetching and mutation hooks |
| 12 | `client/src/pages/TaskListPage.tsx` | ui_components | Task list view with status badges |
| 13 | `client/src/pages/TaskFormPage.tsx` | ui_components | Create/edit task form |
| 14 | `client/src/pages/TeamsPage.tsx` | ui_components | Team list and creation |
| 15 | `client/src/pages/TeamDetailPage.tsx` | ui_components | Team members view with add/remove |
| 16 | `client/src/components/tasks/TaskCard.tsx` | ui_components | Task card component |
| 17 | `client/src/components/tasks/StatusBadge.tsx` | ui_components | Status badge with workflow transition buttons |
| 18 | `client/src/components/teams/MemberList.tsx` | ui_components | Team member list with role indicators |
| 19 | `client/src/App.tsx` | integration | Add routes for task and team pages |

### Pulse Checks

**After `server/src/lib/validation.ts` [PULSE mech_004_step_02]:**
- [ ] File exists at `server/src/lib/validation.ts`
- [ ] Exports `createTaskSchema` (Zod) with title, priority, teamId fields
- [ ] Exports `updateTaskSchema` (Zod) with optional fields
- [ ] Exports `createTeamSchema` (Zod) with name field
- [ ] Exports `addMemberSchema` (Zod) with userId field

**After `server/src/lib/workflow.ts` [PULSE mech_007_step_02]:**
- [ ] File exists at `server/src/lib/workflow.ts`
- [ ] Exports `VALID_TRANSITIONS` constant
- [ ] `VALID_TRANSITIONS` maps TODO → [IN_PROGRESS]
- [ ] `VALID_TRANSITIONS` maps IN_PROGRESS → [REVIEW]
- [ ] `VALID_TRANSITIONS` maps REVIEW → [DONE]
- [ ] `VALID_TRANSITIONS` maps DONE → [] (no forward transitions)
- [ ] Exports `validateTransition` or `isValidTransition` function

**After `server/src/services/task.service.ts` [PULSE mech_004_step_04]:**
- [ ] File exists at `server/src/services/task.service.ts`
- [ ] Exports `createTask` function
- [ ] Exports `getTasks` function
- [ ] Exports `updateTask` function
- [ ] Exports `deleteTask` function
- [ ] Imports and uses workflow transition validation for status changes
- [ ] Imports prisma client

**After `server/src/services/team.service.ts` [PULSE mech_005_step_03]:**
- [ ] File exists at `server/src/services/team.service.ts`
- [ ] Exports `createTeam` function
- [ ] Exports `addMember` function
- [ ] Exports `getTeams` function
- [ ] Exports `removeMember` function
- [ ] Creator auto-assigned as OWNER on team creation

**After `server/src/middleware/authorization.ts` [PULSE mech_006_step_03]:**
- [ ] File exists at `server/src/middleware/authorization.ts`
- [ ] Exports authorization middleware or `checkPermission` function
- [ ] Queries TeamMember table for role
- [ ] Returns 403 for insufficient permissions

**After `server/src/routes/tasks.ts` [PULSE mech_004_step_05]:**
- [ ] File exists at `server/src/routes/tasks.ts`
- [ ] Exports Express Router
- [ ] Defines GET `/api/tasks` route
- [ ] Defines POST `/api/tasks` route
- [ ] Defines PUT `/api/tasks/:id` route
- [ ] Defines DELETE `/api/tasks/:id` route
- [ ] All routes use auth middleware

**After `server/src/routes/teams.ts` [PULSE mech_005_step_05]:**
- [ ] File exists at `server/src/routes/teams.ts`
- [ ] Exports Express Router
- [ ] Defines POST `/api/teams` route
- [ ] Defines GET `/api/teams` route
- [ ] Defines POST `/api/teams/:id/members` route
- [ ] Defines DELETE `/api/teams/:id/members/:memberId` route

**After `server/src/index.ts` [PULSE mech_001_step_06]:**
- [ ] Mounts task router
- [ ] Mounts team router

**After `client/src/lib/api.ts` [PULSE mech_004_step_19]:**
- [ ] Exports `createTask`, `getTasks`, `updateTask`, `deleteTask` functions
- [ ] Exports `createTeam`, `getTeams`, `addMember`, `removeMember` functions

**After `client/src/hooks/useTasks.ts` [PULSE mech_004_step_20]:**
- [ ] File exists at `client/src/hooks/useTasks.ts`
- [ ] Exports `useTasks` hook
- [ ] Fetches tasks from API
- [ ] Provides create/update/delete mutation functions

**After `client/src/hooks/useTeams.ts` [PULSE mech_005_step_11]:**
- [ ] File exists at `client/src/hooks/useTeams.ts`
- [ ] Exports `useTeams` hook
- [ ] Fetches teams from API

**After `client/src/pages/TaskListPage.tsx` [PULSE mech_004_step_20]:**
- [ ] File exists at `client/src/pages/TaskListPage.tsx`
- [ ] Exports default component
- [ ] Renders list of tasks
- [ ] Shows status badges per task

**After `client/src/pages/TaskFormPage.tsx` [PULSE mech_004_step_19]:**
- [ ] File exists at `client/src/pages/TaskFormPage.tsx`
- [ ] Exports default component
- [ ] Renders form with title, description, priority, dueDate, assignee fields
- [ ] Handles both create and edit modes

**After `client/src/pages/TeamsPage.tsx` [PULSE mech_005_step_11]:**
- [ ] File exists at `client/src/pages/TeamsPage.tsx`
- [ ] Exports default component
- [ ] Lists user's teams
- [ ] Provides team creation UI

**After `client/src/pages/TeamDetailPage.tsx` [PULSE mech_005_step_06]:**
- [ ] File exists at `client/src/pages/TeamDetailPage.tsx`
- [ ] Exports default component
- [ ] Shows team members with roles
- [ ] Provides add/remove member UI for OWNERs

**After `client/src/components/tasks/TaskCard.tsx` [PULSE mech_004_step_20]:**
- [ ] File exists at `client/src/components/tasks/TaskCard.tsx`
- [ ] Exports `TaskCard` component
- [ ] Displays task title, status, priority, assignee

**After `client/src/components/tasks/StatusBadge.tsx` [PULSE mech_007_step_03]:**
- [ ] File exists at `client/src/components/tasks/StatusBadge.tsx`
- [ ] Exports `StatusBadge` component
- [ ] Renders color-coded badge based on status value
- [ ] Includes workflow transition buttons (next valid status)

**After `client/src/components/teams/MemberList.tsx` [PULSE mech_005_step_12]:**
- [ ] File exists at `client/src/components/teams/MemberList.tsx`
- [ ] Exports `MemberList` component
- [ ] Displays member name and role

**After `client/src/App.tsx` [PULSE mech_010_step_01]:**
- [ ] Includes routes for `/tasks`, `/tasks/new`, `/tasks/:id/edit`
- [ ] Includes routes for `/teams`, `/teams/:id`

---

## 4. Seam Check Definitions

After all files are built, verify these cross-file connections:

| Provider | Consumer | Validates |
|----------|----------|-----------|
| `server/src/lib/workflow.ts` | `server/src/services/task.service.ts` | `VALID_TRANSITIONS` and `validateTransition` import resolves; called during task status update |
| `server/src/lib/validation.ts` | `server/src/routes/tasks.ts` | `createTaskSchema` and `updateTaskSchema` imports resolve; used for request validation |
| `server/src/lib/validation.ts` | `server/src/routes/teams.ts` | `createTeamSchema` and `addMemberSchema` imports resolve; used for request validation |
| `server/src/services/task.service.ts` | `server/src/routes/tasks.ts` | `createTask`, `getTasks`, `updateTask`, `deleteTask` imports resolve; return types match route responses |
| `server/src/services/team.service.ts` | `server/src/routes/teams.ts` | `createTeam`, `addMember`, `getTeams`, `removeMember` imports resolve |
| `server/src/middleware/authorization.ts` | `server/src/routes/tasks.ts` | authorization middleware import resolves; applied to task mutation routes |
| `server/src/middleware/authorization.ts` | `server/src/routes/teams.ts` | authorization middleware import resolves; applied to member management routes (OWNER-only) |
| `server/src/middleware/auth.ts` (Phase 1) | `server/src/routes/tasks.ts` | auth middleware import resolves; applied to all task routes |
| `server/src/middleware/auth.ts` (Phase 1) | `server/src/routes/teams.ts` | auth middleware import resolves; applied to all team routes |
| `client/src/lib/api.ts` | `client/src/hooks/useTasks.ts` | task API functions import resolves; called within hook |
| `client/src/lib/api.ts` | `client/src/hooks/useTeams.ts` | team API functions import resolves; called within hook |
| `client/src/lib/types.ts` | `client/src/components/tasks/TaskCard.tsx` | Task type import resolves; used as component props type |
| `client/src/lib/types.ts` | `client/src/components/tasks/StatusBadge.tsx` | Status enum/type import resolves; used for badge rendering logic |

---

## 5. Objective and Feature Requirements

### What This Phase Builds

**Task CRUD Operations (mech_004) — CORE MECHANISM:**
- POST `/api/tasks`: Create task with title, description (optional), priority, dueDate (optional), assigneeId (optional), teamId. Requires auth. Returns 201 with task (status defaults to TODO).
- GET `/api/tasks`: List tasks scoped to user's team memberships. Requires auth. Returns task array.
- PUT `/api/tasks/:id`: Update task fields. Status changes validated through workflow. Requires auth + team membership.
- DELETE `/api/tasks/:id`: Delete task. Requires auth + team membership.
- React pages: TaskListPage (list with TaskCard components), TaskFormPage (create/edit form with all fields).
- React hook: `useTasks` for data fetching and mutations.

**Team Management (mech_005):**
- POST `/api/teams`: Create team. Creator auto-assigned as OWNER. Returns 201.
- GET `/api/teams`: List teams where user is a member. Returns teams with member count/roles.
- POST `/api/teams/:id/members`: Add member to team. OWNER-only. Returns 201.
- DELETE `/api/teams/:id/members/:memberId`: Remove member from team. OWNER-only.
- React pages: TeamsPage (list + create), TeamDetailPage (members + add/remove).
- React hook: `useTeams` for data fetching.

**Role-Based Authorization (mech_006):**
- Authorization middleware queries `TeamMember` table for user's role in the target team.
- OWNER: full team management (add/remove members, delete team) + all task operations.
- MEMBER: task CRUD within their teams + status updates on tasks.
- Non-member access returns 403.
- 401 for unauthenticated (handled by Phase 1 auth middleware).

**Task Status Workflow (mech_007):**
- Forward-only state machine: TODO → IN_PROGRESS → REVIEW → DONE.
- `VALID_TRANSITIONS` map in `server/src/lib/workflow.ts`:
  - TODO → [IN_PROGRESS]
  - IN_PROGRESS → [REVIEW]
  - REVIEW → [DONE]
  - DONE → [] (terminal state)
- `validateTransition(current, next)` function returns boolean.
- Task update service checks transition validity before persisting. Invalid transitions return 400.
- StatusBadge component shows color-coded badge + "Advance" button for next valid status.

---

## 6. Pattern References

### Wall Classifications

| Step | Classification | File(s) | Verification Method |
|------|---------------|---------|-------------------|
| mech_004_step_02 | WALL | `server/src/lib/validation.ts` | Zod schemas export for task/team; validate correct/incorrect payloads |
| mech_007_step_02 | WALL | `server/src/lib/workflow.ts` | VALID_TRANSITIONS defines exact forward-only map; validateTransition works |
| mech_004_step_04 | WALL | `server/src/services/task.service.ts` | All 4 CRUD functions exported; status transitions enforced |
| mech_005_step_03 | WALL | `server/src/services/team.service.ts` | All team functions exported; creator gets OWNER role |
| mech_006_step_03 | WALL | `server/src/middleware/authorization.ts` | Queries TeamMember.role; 403 on unauthorized |
| mech_004_step_05 | WALL | `server/src/routes/tasks.ts` | All 4 REST endpoints defined; auth middleware applied |
| mech_005_step_05 | WALL | `server/src/routes/teams.ts` | Team CRUD + member endpoints defined |

### Door Classifications

| Step | Classification | File(s) | Constraints |
|------|---------------|---------|-------------|
| mech_004_step_19 | DOOR | `client/src/lib/api.ts` | Must export named functions for all task/team operations. Internal implementation flexible. |
| mech_004_step_20 | DOOR | `client/src/hooks/useTasks.ts` | Must provide tasks list + mutation functions. State management pattern (useState vs useReducer vs TanStack Query) is flexible. |
| mech_005_step_11 | DOOR | `client/src/hooks/useTeams.ts` | Must provide teams list. Implementation flexible. |

### Room Classifications

| Step | Classification | File(s) | Boundaries |
|------|---------------|---------|------------|
| Task UI | ROOM | `TaskListPage.tsx`, `TaskFormPage.tsx`, `TaskCard.tsx` | Must display correct data and handle CRUD. Visual design, layout, interactions are open. Stay within Tailwind. |
| Team UI | ROOM | `TeamsPage.tsx`, `TeamDetailPage.tsx`, `MemberList.tsx` | Must display teams/members and handle operations. Visual design is open. |
| StatusBadge | ROOM | `StatusBadge.tsx` | Must show color-coded status and provide transition button. Color scheme and button design are open. |

---

## 7. Violation Handling Instructions

| Severity | Trigger | Response |
|----------|---------|----------|
| **LOW** | Added new type exports to `client/src/lib/types.ts` | Log: types file is shared — additive type exports are expected in Phase 2 |
| **MEDIUM** | Modified a Phase 1 file beyond what's in files_allowed (e.g., `auth.service.ts`) | Review: if fixing a Phase 1 bug, document and proceed. If refactoring, revert — Phase 1 is read-only. |
| **MEDIUM** | Modified a Phase 3 file (e.g., `dashboard.service.ts`, `TaskFilters.tsx`) | Review: if additive (stub/placeholder), proceed with caution. If substantive, revert. |
| **HIGH** | Deleted any existing file or removed Phase 1 exports | Revert entire phase — Phase 2 must not break Phase 1 contracts |
| **HIGH** | Modified `prisma/schema.prisma` (read-only in Phase 2) | Revert file — schema is frozen after Phase 1 |
| **CRITICAL** | Modified `.env`, `CLAUDE.md`, or `BUILD_RULES.md` | FULL STOP — human review required |
| **CRITICAL** | Modified `server/src/middleware/auth.ts` in a way that changes JWT verification behavior | FULL STOP — auth middleware changes affect all protected routes across all phases |

---

## 8. Full Checkpoint at End

Run ALL FOUR STEPS after completing Phase 2. Every check must pass.

### Step 1: Pattern Check
```bash
git diff --name-only
```
Verify all changed files exist in the Phase 2 `files_allowed` list. Verify Phase 1 `files_read_only` files are unmodified.

### Step 2: Compile Check
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```
Zero TypeScript errors on both.

### Step 3: Read-Only Integrity
```bash
git diff ${BASELINE_SHA}..HEAD -- prisma/schema.prisma server/src/lib/prisma.ts server/src/middleware/auth.ts server/src/services/auth.service.ts client/src/context/AuthContext.tsx client/src/components/layout/AppShell.tsx
```
Expected: empty output (no changes to Phase 1 read-only files).

### Step 4: Functional Checks
- [ ] POST `/api/teams` with valid data returns 201 with team + creator as OWNER
- [ ] POST `/api/teams/:id/members` as OWNER returns 201
- [ ] POST `/api/teams/:id/members` as MEMBER returns 403
- [ ] GET `/api/teams` returns only user's teams with roles
- [ ] POST `/api/tasks` with valid data returns 201 with status TODO
- [ ] GET `/api/tasks` returns tasks scoped to user's teams
- [ ] PUT `/api/tasks/:id` with status TODO→IN_PROGRESS returns 200
- [ ] PUT `/api/tasks/:id` with status TODO→DONE returns 400 (invalid transition)
- [ ] DELETE `/api/tasks/:id` as team member returns 200
- [ ] DELETE `/api/tasks/:id` as non-member returns 403
- [ ] All Phase 1 auth endpoints still work (regression)

---

## 9. Gate Condition

**ALL FOUR STEPS MUST PASS BEFORE PROCEEDING TO PHASE 3.**

If any step fails:
1. Diagnose the specific failure
2. Fix only the failing component
3. Re-run ALL four steps (not just the one that failed)
4. If two fresh attempts both fail, STOP for human review (two-strike rule)
