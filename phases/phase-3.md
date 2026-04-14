# Phase 3: Discovery, Dashboard & Testing

> **Mechanisms:** mech_008 (Task Filtering & Sorting), mech_009 (Progress Dashboard), mech_012 (Test Suite)
> **Estimated tokens:** 80,000 content + 25,000 overhead
> **Dependencies:** Phase 2 (Core Features)

---

## 1. Build Rules Preamble

### Core Engineering Rules

You are building Phase 3 of a Team Task Manager. Phase 1 (foundation, auth) and Phase 2 (task CRUD, teams, authorization, workflow) are complete. This phase adds task filtering/sorting, a progress dashboard with overdue highlighting, and a Vitest test suite covering all API endpoints.

**Architecture (established in Phase 1 — do not change):**
- React 18 + TypeScript + Vite + Tailwind CSS (frontend, in `client/`)
- Node.js + Express + TypeScript (backend, in `server/`)
- SQLite via Prisma ORM (database)
- JWT + bcrypt (authentication)
- Zod (input validation)
- Forward-only status workflow: TODO→IN_PROGRESS→REVIEW→DONE

**Mandatory Patterns:**
1. **Single responsibility per file/component.**
2. **Service layer access only.** Routes → services → Prisma.
3. **Boundary validation at every entry point.**
4. **TypeScript strict mode.** No `any` types.
5. **Error responses use proper HTTP status codes.**
6. **Filter/sort parameters are query params on GET `/api/tasks`.** Server-side filtering/sorting via Prisma where/orderBy.
7. **Dashboard stats computed server-side.** Prisma groupBy for counts, date comparison for overdue.
8. **Tests use a real test database.** No mocking the database. Supertest for HTTP assertions.
9. **At least 1 happy-path test per API endpoint.** This is the minimum bar.

**Forbidden Patterns:**
1. **NO direct Prisma calls from route handlers.**
2. **NO `any` types.**
3. **NO modifying Phase 1 or Phase 2 read-only files.** See files_read_only list.
4. **NO client-side filtering/sorting.** Filters and sorts are applied server-side via query params.
5. **NO mocking the database in tests.** Tests must use a real SQLite test database.
6. **NO charts or graphs.** Dashboard shows numeric counts and overdue task lists only.

**Required Patterns:**
1. Query params on GET `/api/tasks`: `status`, `priority`, `assigneeId`, `dueDate`, `sortBy`, `sortOrder`.
2. Service layer builds Prisma `where` clause from filter params and `orderBy` from sort params.
3. Dashboard service uses `prisma.task.groupBy` or equivalent for status counts.
4. Overdue = `dueDate < now AND status !== DONE`.
5. Vitest config in `server/vitest.config.ts` with test database isolation.
6. Test setup utility in `server/src/tests/setup.ts` for database init/cleanup.
7. Supertest for HTTP endpoint testing in all test files.

---

## 2. File Sandbox Declaration

### files_allowed (you MAY create or modify these files)
```
server/src/services/task.service.ts
server/src/services/dashboard.service.ts
server/src/routes/tasks.ts
server/src/routes/dashboard.ts
server/src/index.ts
server/vitest.config.ts
server/src/tests/setup.ts
server/src/tests/auth.test.ts
server/src/tests/tasks.test.ts
server/src/tests/teams.test.ts
server/src/tests/dashboard.test.ts
client/src/lib/api.ts
client/src/lib/types.ts
client/src/hooks/useTasks.ts
client/src/hooks/useDashboard.ts
client/src/components/tasks/TaskFilters.tsx
client/src/components/tasks/TaskSort.tsx
client/src/components/dashboard/StatusCard.tsx
client/src/components/dashboard/OverdueList.tsx
client/src/pages/TaskListPage.tsx
client/src/pages/DashboardPage.tsx
client/src/App.tsx
```

### files_read_only (you may READ but NOT modify)
```
prisma/schema.prisma
server/src/lib/prisma.ts
server/src/lib/validation.ts
server/src/lib/workflow.ts
server/src/middleware/auth.ts
server/src/middleware/authorization.ts
server/src/services/auth.service.ts
server/src/services/team.service.ts
server/src/routes/auth.ts
server/src/routes/teams.ts
client/src/context/AuthContext.tsx
client/src/components/layout/AppShell.tsx
client/src/components/tasks/TaskCard.tsx
client/src/components/tasks/StatusBadge.tsx
client/src/components/teams/MemberList.tsx
client/src/hooks/useTeams.ts
client/src/pages/TaskFormPage.tsx
client/src/pages/TeamsPage.tsx
client/src/pages/TeamDetailPage.tsx
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

| Order | File | Layer | Rationale |
|-------|------|-------|-----------|
| 1 | `server/src/services/task.service.ts` | core_logic | Add filtering and sorting to task queries |
| 2 | `server/src/services/dashboard.service.ts` | core_logic | Prisma groupBy for counts, overdue detection |
| 3 | `server/src/routes/tasks.ts` | integration | Wire query params to service filtering/sorting |
| 4 | `server/src/routes/dashboard.ts` | integration | GET /api/dashboard endpoint |
| 5 | `server/src/index.ts` | integration | Mount dashboard router |
| 6 | `client/src/lib/api.ts` | state_management | Add dashboard API + filter params to task fetch |
| 7 | `client/src/hooks/useTasks.ts` | state_management | Add filter/sort state and query param generation |
| 8 | `client/src/hooks/useDashboard.ts` | state_management | Dashboard data fetching hook |
| 9 | `client/src/components/tasks/TaskFilters.tsx` | ui_components | Filter controls UI |
| 10 | `client/src/components/tasks/TaskSort.tsx` | ui_components | Sort toggle UI |
| 11 | `client/src/pages/TaskListPage.tsx` | ui_components | Integrate filter/sort controls |
| 12 | `client/src/pages/DashboardPage.tsx` | ui_components | Status cards + overdue list |
| 13 | `client/src/components/dashboard/StatusCard.tsx` | ui_components | Individual status count card |
| 14 | `client/src/components/dashboard/OverdueList.tsx` | ui_components | Overdue tasks with highlighting |
| 15 | `client/src/App.tsx` | integration | Add dashboard route |
| 16 | `server/vitest.config.ts` | core_logic | Vitest configuration |
| 17 | `server/src/tests/setup.ts` | core_logic | Test database setup/teardown |
| 18 | `server/src/tests/auth.test.ts` | integration | Auth endpoint tests |
| 19 | `server/src/tests/tasks.test.ts` | integration | Task endpoint tests |
| 20 | `server/src/tests/teams.test.ts` | integration | Team endpoint tests |
| 21 | `server/src/tests/dashboard.test.ts` | integration | Dashboard endpoint tests |

### Pulse Checks

**After `server/src/services/task.service.ts` [PULSE mech_008_step_03]:**
- [ ] `getTasks` function accepts filter params (status, priority, assigneeId, dueDate)
- [ ] `getTasks` function accepts sort params (sortBy, sortOrder)
- [ ] Builds Prisma `where` clause from filter params
- [ ] Builds Prisma `orderBy` from sort params

**After `server/src/services/dashboard.service.ts` [PULSE mech_009_step_01]:**
- [ ] File exists at `server/src/services/dashboard.service.ts`
- [ ] Exports `getDashboardStats` or similar function
- [ ] Uses Prisma groupBy or aggregate for status counts
- [ ] Compares dueDate to current date for overdue detection

**After `server/src/routes/tasks.ts` [PULSE mech_008_step_01]:**
- [ ] GET `/api/tasks` accepts query params: status, priority, assigneeId, dueDate, sortBy, sortOrder
- [ ] Passes query params to service layer

**After `server/src/routes/dashboard.ts` [PULSE mech_009_step_01]:**
- [ ] File exists at `server/src/routes/dashboard.ts`
- [ ] Exports Express Router
- [ ] Defines GET `/api/dashboard` route
- [ ] Uses auth middleware
- [ ] Returns status counts and overdue tasks

**After `server/src/index.ts` [PULSE mech_001_step_06]:**
- [ ] Mounts dashboard router at `/api/dashboard` or similar

**After `client/src/lib/api.ts` [PULSE mech_009_step_01]:**
- [ ] Exports `getDashboardStats` function
- [ ] `getTasks` function accepts filter and sort parameters

**After `client/src/hooks/useTasks.ts` [PULSE mech_008_step_01]:**
- [ ] `useTasks` hook accepts filter/sort state parameters
- [ ] Passes filter/sort to API call
- [ ] Refetches when filter/sort params change

**After `client/src/hooks/useDashboard.ts` [PULSE mech_009_step_01]:**
- [ ] File exists at `client/src/hooks/useDashboard.ts`
- [ ] Exports `useDashboard` hook
- [ ] Fetches dashboard stats from API
- [ ] Returns status counts and overdue tasks

**After `client/src/components/tasks/TaskFilters.tsx` [PULSE mech_008_step_04]:**
- [ ] File exists at `client/src/components/tasks/TaskFilters.tsx`
- [ ] Exports `TaskFilters` component
- [ ] Renders select/input for status, priority, assignee, due date filters
- [ ] Calls onChange callback with filter values

**After `client/src/components/tasks/TaskSort.tsx` [PULSE mech_008_step_05]:**
- [ ] File exists at `client/src/components/tasks/TaskSort.tsx`
- [ ] Exports `TaskSort` component
- [ ] Supports sorting by priority, due date, created date
- [ ] Supports ascending/descending toggle

**After `client/src/pages/TaskListPage.tsx` [PULSE mech_008_step_04]:**
- [ ] Integrates `TaskFilters` component
- [ ] Integrates `TaskSort` component
- [ ] Passes filter/sort state to `useTasks` hook

**After `client/src/pages/DashboardPage.tsx` [PULSE mech_009_step_01]:**
- [ ] File exists at `client/src/pages/DashboardPage.tsx`
- [ ] Exports default component
- [ ] Renders status count cards (TODO, IN_PROGRESS, REVIEW, DONE)
- [ ] Renders overdue task list with visual highlighting

**After `client/src/components/dashboard/StatusCard.tsx` [PULSE mech_009_step_01]:**
- [ ] File exists at `client/src/components/dashboard/StatusCard.tsx`
- [ ] Exports `StatusCard` component
- [ ] Displays status name and count

**After `client/src/components/dashboard/OverdueList.tsx` [PULSE mech_009_step_01]:**
- [ ] File exists at `client/src/components/dashboard/OverdueList.tsx`
- [ ] Exports `OverdueList` component
- [ ] Renders tasks with red/warning highlighting
- [ ] Shows task title, assignee, and how overdue

**After `client/src/App.tsx` [PULSE mech_010_step_01]:**
- [ ] Includes route for `/dashboard` or similar

**After `server/vitest.config.ts` [PULSE mech_012_step_01]:**
- [ ] File exists at `server/vitest.config.ts`
- [ ] Configures Vitest for server-side testing
- [ ] Sets up test environment (node)
- [ ] Configures test database or in-memory SQLite

**After `server/src/tests/setup.ts` [PULSE mech_012_step_01]:**
- [ ] File exists at `server/src/tests/setup.ts`
- [ ] Exports test database initialization utility
- [ ] Exports cleanup/teardown utility
- [ ] Creates isolated test database

**After `server/src/tests/auth.test.ts` [PULSE mech_012_step_02]:**
- [ ] File exists at `server/src/tests/auth.test.ts`
- [ ] Has at least 1 test for POST `/auth/register`
- [ ] Has at least 1 test for POST `/auth/login`
- [ ] Has at least 1 test for GET `/auth/me`
- [ ] Uses supertest for HTTP assertions

**After `server/src/tests/tasks.test.ts` [PULSE mech_012_step_02]:**
- [ ] File exists at `server/src/tests/tasks.test.ts`
- [ ] Has at least 1 test for POST `/api/tasks`
- [ ] Has at least 1 test for GET `/api/tasks`
- [ ] Has at least 1 test for PUT `/api/tasks/:id`
- [ ] Has at least 1 test for DELETE `/api/tasks/:id`
- [ ] Tests run with authenticated requests (JWT in headers)

**After `server/src/tests/teams.test.ts` [PULSE mech_012_step_02]:**
- [ ] File exists at `server/src/tests/teams.test.ts`
- [ ] Has at least 1 test for POST `/api/teams`
- [ ] Has at least 1 test for GET `/api/teams`
- [ ] Has at least 1 test for POST `/api/teams/:id/members`
- [ ] Has at least 1 test for DELETE `/api/teams/:id/members/:memberId`

**After `server/src/tests/dashboard.test.ts` [PULSE mech_012_step_02]:**
- [ ] File exists at `server/src/tests/dashboard.test.ts`
- [ ] Has at least 1 test for GET `/api/dashboard`
- [ ] Verifies status counts are returned
- [ ] Verifies overdue tasks are identified

---

## 4. Seam Check Definitions

| Provider | Consumer | Validates |
|----------|----------|-----------|
| `server/src/services/task.service.ts` | `server/src/routes/tasks.ts` | getTasks with filter/sort params — route passes query params, service builds correct Prisma query |
| `server/src/services/dashboard.service.ts` | `server/src/routes/dashboard.ts` | getDashboardStats import resolves; return type includes statusCounts and overdueTasks |
| `server/src/routes/dashboard.ts` | `server/src/index.ts` | dashboard router import resolves; mounted at correct path prefix |
| `client/src/lib/api.ts` | `client/src/hooks/useDashboard.ts` | getDashboardStats API function import resolves; called within hook |
| `client/src/hooks/useTasks.ts` | `client/src/pages/TaskListPage.tsx` | useTasks hook import resolves; provides tasks array and filter/sort controls |
| `client/src/hooks/useDashboard.ts` | `client/src/pages/DashboardPage.tsx` | useDashboard hook import resolves; provides statusCounts and overdueTasks |
| `client/src/components/tasks/TaskFilters.tsx` | `client/src/pages/TaskListPage.tsx` | TaskFilters component import resolves; receives filter state and onChange callback |
| `client/src/components/tasks/TaskSort.tsx` | `client/src/pages/TaskListPage.tsx` | TaskSort component import resolves; receives sort state and onChange callback |
| `client/src/components/dashboard/StatusCard.tsx` | `client/src/pages/DashboardPage.tsx` | StatusCard component import resolves; receives status name and count props |
| `client/src/components/dashboard/OverdueList.tsx` | `client/src/pages/DashboardPage.tsx` | OverdueList component import resolves; receives overdue tasks array |
| `server/src/tests/setup.ts` | `server/src/tests/auth.test.ts` | test setup utilities import resolves; beforeAll/afterAll use setup/teardown |
| `server/src/tests/setup.ts` | `server/src/tests/tasks.test.ts` | test setup utilities import resolves |
| `server/src/tests/setup.ts` | `server/src/tests/teams.test.ts` | test setup utilities import resolves |
| `server/src/tests/setup.ts` | `server/src/tests/dashboard.test.ts` | test setup utilities import resolves |

---

## 5. Objective and Feature Requirements

### What This Phase Builds

**Task Filtering & Sorting (mech_008):**
- Server-side filtering on GET `/api/tasks` via query parameters:
  - `status` — filter by task status (TODO, IN_PROGRESS, REVIEW, DONE)
  - `priority` — filter by priority (LOW, MEDIUM, HIGH, URGENT)
  - `assigneeId` — filter by assigned user
  - `dueDate` — filter by due date (before/on date)
- Server-side sorting via query parameters:
  - `sortBy` — field to sort by (priority, dueDate, createdAt)
  - `sortOrder` — direction (asc, desc)
- Service layer builds Prisma `where` clause from filters and `orderBy` from sort params
- React TaskFilters component with select/input controls for each filter
- React TaskSort component with sort field and direction toggle
- TaskListPage integrates both components, passes state to useTasks hook

**Progress Dashboard (mech_009):**
- GET `/api/dashboard` endpoint returning:
  - `statusCounts`: object with count per status (TODO: N, IN_PROGRESS: N, REVIEW: N, DONE: N)
  - `overdueTasks`: array of tasks where dueDate < now AND status !== DONE
- Dashboard service uses Prisma groupBy for status counts, date comparison for overdue
- DashboardPage renders 4 StatusCard components (one per status) and OverdueList
- OverdueList shows task title, assignee, and visual red/warning highlighting
- No charts or graphs — numeric counts and task lists only

**Test Suite (mech_012):**
- Vitest configuration in `server/vitest.config.ts`
- Test database setup in `server/src/tests/setup.ts`:
  - Creates isolated SQLite test database (separate from dev.db)
  - Runs Prisma migrations on test DB
  - Provides cleanup/teardown between test suites
- Minimum 1 happy-path test per API endpoint using supertest:
  - `auth.test.ts`: POST /auth/register (201), POST /auth/login (200), GET /auth/me (200)
  - `tasks.test.ts`: POST /api/tasks (201), GET /api/tasks (200), PUT /api/tasks/:id (200), DELETE /api/tasks/:id (200)
  - `teams.test.ts`: POST /api/teams (201), GET /api/teams (200), POST /api/teams/:id/members (201), DELETE /api/teams/:id/members/:memberId (200)
  - `dashboard.test.ts`: GET /api/dashboard (200 with statusCounts and overdueTasks)
- All test files use authenticated requests (register user → get JWT → send in headers)

---

## 6. Pattern References

### Wall Classifications

| Step | Classification | File(s) | Verification Method |
|------|---------------|---------|-------------------|
| mech_008_step_03 | WALL | `server/src/services/task.service.ts` | getTasks accepts and applies filter/sort params via Prisma where/orderBy |
| mech_009_step_01 | WALL | `server/src/services/dashboard.service.ts` | getDashboardStats returns statusCounts + overdueTasks; uses Prisma groupBy |
| mech_008_step_01 | WALL | `server/src/routes/tasks.ts` | GET /api/tasks accepts query params and passes to service |
| mech_009_step_01 | WALL | `server/src/routes/dashboard.ts` | GET /api/dashboard returns correct response shape |
| mech_012_step_01 | WALL | `server/vitest.config.ts`, `server/src/tests/setup.ts` | Vitest configured; test DB isolation works |
| mech_012_step_02 | WALL | `server/src/tests/*.test.ts` | All 4 test files exist; minimum test counts met; all pass |

### Door Classifications

| Step | Classification | File(s) | Constraints |
|------|---------------|---------|-------------|
| mech_008_step_04 | DOOR | `client/src/components/tasks/TaskFilters.tsx` | Must provide filter controls for status, priority, assignee, due date. UI design flexible. |
| mech_008_step_05 | DOOR | `client/src/components/tasks/TaskSort.tsx` | Must support 3 sort fields + direction. UI design flexible. |
| mech_009_step_01 | DOOR | `client/src/hooks/useDashboard.ts` | Must fetch and return dashboard stats. State management pattern flexible. |

### Room Classifications

| Step | Classification | File(s) | Boundaries |
|------|---------------|---------|------------|
| Dashboard UI | ROOM | `DashboardPage.tsx`, `StatusCard.tsx`, `OverdueList.tsx` | Must show counts and overdue. No charts. Visual design open within Tailwind. |
| Test structure | ROOM | `server/src/tests/*.test.ts` | Must meet minimum test counts. Test organization, helper functions, assertion style are open. |

---

## 7. Violation Handling Instructions

| Severity | Trigger | Response |
|----------|---------|----------|
| **LOW** | Added test helper utilities beyond setup.ts | Log: additional test helpers are acceptable if they support test clarity |
| **MEDIUM** | Modified a Phase 1 or Phase 2 read-only file | Review: if fixing a bug found during testing, document the bug and fix. If refactoring, revert. |
| **HIGH** | Deleted any existing file or removed Phase 1/2 exports | Revert entire phase — Phase 3 must not break existing contracts |
| **HIGH** | Modified `prisma/schema.prisma` | Revert file — schema is frozen after Phase 1 |
| **HIGH** | Test files import and execute production code that modifies the dev database | Revert test file — tests must use isolated test database, never dev.db |
| **CRITICAL** | Modified `.env`, `CLAUDE.md`, or `BUILD_RULES.md` | FULL STOP — human review required |
| **CRITICAL** | Tests pass by mocking the database instead of using a real test database | FULL STOP — review required. Spec requires integration-level testing with real database. |

---

## 8. Full Checkpoint at End

Run ALL FOUR STEPS after completing Phase 3. Every check must pass.

### Step 1: Pattern Check
```bash
git diff --name-only
```
Verify all changed files exist in the Phase 3 `files_allowed` list. Verify Phase 1 and Phase 2 `files_read_only` files are unmodified.

### Step 2: Compile Check
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```
Zero TypeScript errors on both.

### Step 3: Functional Checks
- [ ] GET `/api/tasks?status=TODO` returns only TODO tasks
- [ ] GET `/api/tasks?priority=HIGH` returns only HIGH priority tasks
- [ ] GET `/api/tasks?sortBy=dueDate&sortOrder=asc` returns tasks sorted by due date ascending
- [ ] GET `/api/tasks` with multiple filters returns intersection of filters
- [ ] GET `/api/dashboard` returns statusCounts with TODO, IN_PROGRESS, REVIEW, DONE counts
- [ ] GET `/api/dashboard` returns overdueTasks array with tasks past dueDate and not DONE
- [ ] All Phase 1 + Phase 2 endpoints still work (full regression)

### Step 4: Test Suite
```bash
cd server && npx vitest run
```
- [ ] `auth.test.ts` — at least 3 tests pass (register, login, me)
- [ ] `tasks.test.ts` — at least 4 tests pass (CRUD)
- [ ] `teams.test.ts` — at least 4 tests pass (create, list, add member, remove member)
- [ ] `dashboard.test.ts` — at least 1 test passes

---

## 9. Gate Condition

**ALL FOUR STEPS MUST PASS. THIS IS THE FINAL PHASE.**

If any step fails:
1. Diagnose the specific failure
2. Fix only the failing component
3. Re-run ALL four steps (not just the one that failed)
4. If two fresh attempts both fail, STOP for human review (two-strike rule)

**On success:** The Team Task Manager build is complete. All mechanisms implemented, all tests passing.
