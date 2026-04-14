# Phase 3: Discovery, Dashboard & Testing — Enriched with Implementation Intelligence

> **Mechanisms:** mech_008 (Task Filtering & Sorting), mech_009 (Progress Dashboard), mech_012 (Test Suite)
> **Estimated tokens:** 80,000 content + 25,000 overhead
> **Dependencies:** Phase 2 (Core Features) — Phase 1 + 2 files are READ-ONLY
> **Enrichment source:** Greptacular filter hooks + BUILD_RULES.md test/query patterns

---

## Patterns to Mirror

### PATTERN 1: Filter State → Query Key (from Greptacular)
**SOURCE:** Greptacular `ui/src/hooks/useActionLog.ts:1-45`
```typescript
// client/src/hooks/useTasks.ts — enhanced with filters
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],  // Filters in key = auto-refetch on change
    queryFn: () => api.getTasks(filters),
    enabled: true,
  })
}

// TaskFilters type
interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
  dueDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```
**Use in:** Update `client/src/hooks/useTasks.ts` to accept filter/sort params. Query key includes filters so TanStack Query auto-refetches when any filter changes.

### PATTERN 2: Prisma Conditional Filter Building (from BUILD_RULES.md)
**SOURCE:** BUILD_RULES.md:104-110
```typescript
// server/src/services/task.service.ts — enhanced getTasks
export async function getTasks(userId: string, filters: {
  status?: string
  priority?: string
  assigneeId?: string
  dueDate?: string
  sortBy?: string
  sortOrder?: string
}) {
  // Get user's team IDs
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true }
  })
  const teamIds = memberships.map(m => m.teamId)

  // Build where clause
  const where: Prisma.TaskWhereInput = { teamId: { in: teamIds } }
  if (filters.status) where.status = filters.status as Status
  if (filters.priority) where.priority = filters.priority as Priority
  if (filters.assigneeId) where.assigneeId = filters.assigneeId
  if (filters.dueDate) where.dueDate = { lte: new Date(filters.dueDate) }

  // Build orderBy
  const orderBy: Prisma.TaskOrderByWithRelationInput = {}
  if (filters.sortBy) {
    const field = filters.sortBy as keyof Prisma.TaskOrderByWithRelationInput
    orderBy[field] = (filters.sortOrder || 'desc') as Prisma.SortOrder
  } else {
    orderBy.createdAt = 'desc'  // Default sort
  }

  return prisma.task.findMany({ where, orderBy, include: { assignee: true, team: true } })
}
```
**Use in:** `server/src/services/task.service.ts` — MODIFY the existing `getTasks` function.

### PATTERN 3: Dashboard Aggregation with Prisma groupBy
**SOURCE:** Derived from PRD spec + Prisma docs
```typescript
// server/src/services/dashboard.service.ts
import { prisma } from '../lib/prisma'

export async function getDashboardStats(userId: string) {
  // Get user's team IDs
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true }
  })
  const teamIds = memberships.map(m => m.teamId)

  // Status counts via groupBy
  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    where: { teamId: { in: teamIds } },
    _count: { status: true }
  })

  const statusCounts = {
    TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0,
    ...Object.fromEntries(statusGroups.map(g => [g.status, g._count.status]))
  }

  // Overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      teamId: { in: teamIds },
      status: { not: 'DONE' },
      dueDate: { lt: new Date() }
    },
    include: { assignee: true, team: true },
    orderBy: { dueDate: 'asc' }
  })

  return { statusCounts, overdueTasks }
}
```
**Use in:** `server/src/services/dashboard.service.ts` — create new file with this pattern.

### PATTERN 4: Vitest + Supertest Test Structure (from BUILD_RULES.md)
**SOURCE:** BUILD_RULES.md:44-76
```typescript
// server/src/tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { app } from '../index'
import { setupTestDb, teardownTestDb } from './setup'

describe('Auth endpoints', () => {
  let token: string

  beforeAll(async () => {
    await setupTestDb()
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('POST /auth/register creates user and returns JWT', async () => {
    const res = await supertest(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', name: 'Test User', password: 'password123' })
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toHaveProperty('email', 'test@test.com')
    expect(res.body.user).not.toHaveProperty('password')
    token = res.body.token
  })

  it('POST /auth/login returns JWT for valid credentials', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('GET /auth/me returns current user with valid JWT', async () => {
    const res = await supertest(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('email', 'test@test.com')
  })
})
```
**Use in:** All 4 test files. This exact pattern: register → get token → use token in subsequent requests.

### PATTERN 5: Test Database Isolation
**SOURCE:** Derived from Vitest + Prisma best practices
```typescript
// server/src/tests/setup.ts
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const TEST_DB_URL = 'file:./test.db'

let testPrisma: PrismaClient

export async function setupTestDb() {
  process.env.DATABASE_URL = TEST_DB_URL
  
  // Push schema to test database (no migration files needed)
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL }
  })
  
  testPrisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } }
  })
  await testPrisma.$connect()
}

export async function teardownTestDb() {
  await testPrisma.$disconnect()
}
```
**Use in:** `server/src/tests/setup.ts` — test DB must be separate from dev.db. `--force-reset` cleans between runs.

---

## Mandatory Reading (Priority-Ordered)

### P0 — Must Read Before Writing Any Code
| File | Why |
|------|-----|
| Phase 2 `server/src/services/task.service.ts` | You MODIFY this file to add filtering/sorting |
| Phase 2 `server/src/routes/tasks.ts` | You MODIFY this to wire query params |
| Phase 1 `server/src/index.ts` | You MODIFY this to mount dashboard router |
| Phase 2 `client/src/hooks/useTasks.ts` | You MODIFY this to accept filter/sort params |
| Phase 2 `client/src/pages/TaskListPage.tsx` | You MODIFY this to integrate filter/sort UI |

### P1 — Read When Building Specific Files
| File | When |
|------|------|
| Phase 1 `server/src/middleware/auth.ts` | Before writing test files (need to understand auth flow for test setup) |
| Phase 1 `server/src/services/auth.service.ts` | Before writing auth tests |
| Phase 2 `server/src/services/team.service.ts` | Before writing team tests |
| Phase 2 `server/src/routes/teams.ts` | Before writing team tests |

---

## Per-File Implementation Details

### 1. `server/src/services/task.service.ts` (MODIFY)
**What changes:** Enhance `getTasks` to accept filter and sort parameters.
- Add `status`, `priority`, `assigneeId`, `dueDate` filter params
- Add `sortBy` (priority, dueDate, createdAt) and `sortOrder` (asc, desc) params
- Build Prisma `where` clause conditionally (PATTERN 2)
- Build Prisma `orderBy` from sort params
- **Do NOT break existing callers** — all new params should be optional

### 2. `server/src/services/dashboard.service.ts` (CREATE)
Use PATTERN 3 exactly. Single function `getDashboardStats(userId)` returns `{ statusCounts, overdueTasks }`.

**Gotcha:** `prisma.task.groupBy` returns only statuses that have tasks. You must initialize all 4 status counts to 0, then merge in the groupBy results.

### 3. `server/src/routes/tasks.ts` (MODIFY)
**What changes:** GET handler extracts query params and passes to service.
```typescript
router.get('/', async (req, res) => {
  const { status, priority, assigneeId, dueDate, sortBy, sortOrder } = req.query
  const tasks = await taskService.getTasks(req.userId!, {
    status: status as string | undefined,
    priority: priority as string | undefined,
    assigneeId: assigneeId as string | undefined,
    dueDate: dueDate as string | undefined,
    sortBy: sortBy as string | undefined,
    sortOrder: sortOrder as string | undefined,
  })
  res.json(tasks)
})
```

### 4. `server/src/routes/dashboard.ts` (CREATE)
```typescript
import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as dashboardService from '../services/dashboard.service'

const router = Router()
router.use(auth)

router.get('/', async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.userId!)
  res.json(stats)
})

export default router
```
**Mount in index.ts:** `app.use('/api/dashboard', dashboardRouter)`

### 5. `client/src/lib/api.ts` (MODIFY)
```typescript
// Enhanced getTasks with filter/sort params
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId)
  if (filters?.dueDate) params.set('dueDate', filters.dueDate)
  if (filters?.sortBy) params.set('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder)
  const query = params.toString()
  return fetchJSON(`/api/tasks${query ? `?${query}` : ''}`)
}

// New dashboard endpoint
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchJSON('/api/dashboard')
}
```

### 6. `client/src/hooks/useTasks.ts` (MODIFY)
Use PATTERN 1. Filters go into the query key for automatic refetch.

### 7. `client/src/hooks/useDashboard.ts` (CREATE)
```typescript
import { useQuery } from '@tanstack/react-query'
import * as api from '../lib/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboardStats,
  })
}
```

### 8. `client/src/components/tasks/TaskFilters.tsx` (CREATE)
**DOOR:** Must provide filter controls for status, priority, assignee, due date.
- Use `<select>` elements for status and priority (enum values as options)
- Use `<input>` or `<select>` for assignee (populated from team members)
- Use `<input type="date">` for due date
- Call `onChange` callback with updated filter object
- Responsive: stack vertically on mobile, horizontal on desktop

### 9. `client/src/components/tasks/TaskSort.tsx` (CREATE)
**DOOR:** Must support 3 sort fields + direction toggle.
- Sort by: priority, dueDate, createdAt
- Direction: asc/desc toggle button
- Call `onChange` with `{ sortBy, sortOrder }`

### 10. `client/src/pages/TaskListPage.tsx` (MODIFY)
Integrate TaskFilters + TaskSort above the task list. Pass filter/sort state to `useTasks` hook.

### 11. `client/src/pages/DashboardPage.tsx` (CREATE)
**ROOM:** Must show 4 StatusCards + OverdueList. No charts.
```tsx
export default function DashboardPage() {
  const { data, isLoading } = useDashboard()
  
  if (isLoading) return <Loading />
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(data.statusCounts).map(([status, count]) => (
          <StatusCard key={status} status={status} count={count} />
        ))}
      </div>
      <OverdueList tasks={data.overdueTasks} />
    </div>
  )
}
```

### 12-14. Dashboard Components
- **StatusCard:** Card with status name + count number. Color-coded (green for DONE, yellow for IN_PROGRESS, etc.)
- **OverdueList:** Red/warning styled list. Each item shows task title, assignee name, and days overdue.

### 15. Test Files (4 files)
All follow PATTERN 4. Key test chains:

**`auth.test.ts`** (3 tests minimum):
- POST /auth/register → 201 + token
- POST /auth/login → 200 + token
- GET /auth/me → 200 + user

**`tasks.test.ts`** (4 tests minimum):
Setup: register user → create team → get token
- POST /api/tasks → 201 + task with status TODO
- GET /api/tasks → 200 + array
- PUT /api/tasks/:id (status TODO→IN_PROGRESS) → 200
- DELETE /api/tasks/:id → 200

**`teams.test.ts`** (4 tests minimum):
Setup: register user → get token
- POST /api/teams → 201 + team
- GET /api/teams → 200 + array
- POST /api/teams/:id/members → 201 (need second user)
- DELETE /api/teams/:id/members/:memberId → 200

**`dashboard.test.ts`** (1 test minimum):
Setup: register → create team → create tasks with various statuses
- GET /api/dashboard → 200 + { statusCounts, overdueTasks }

### 16. `server/vitest.config.ts` (CREATE)
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000,
  },
})
```

---

## Gotchas

1. **Test DB isolation is CRITICAL.** Tests must NEVER touch `dev.db`. Use `file:./test.db` or an in-memory SQLite variant. `--force-reset` ensures clean state between runs.

2. **Prisma groupBy returns sparse results.** If no tasks have status REVIEW, the groupBy result won't include a REVIEW entry. You must initialize all 4 statuses to 0 and merge.

3. **Overdue calculation timezone:** `new Date()` uses server local time. For SQLite date comparisons via Prisma, ensure consistent UTC handling. Use `dueDate: { lt: new Date() }` — Prisma handles the conversion.

4. **Test ordering matters.** Tests within a `describe` block run sequentially. Later tests can depend on data created by earlier tests (e.g., register → login → create team → create task → test dashboard).

5. **Express app export for supertest.** Phase 1's `server/src/index.ts` must export `app` (not just call `listen`). If it doesn't, you need to modify `index.ts` (which IS in files_allowed for Phase 3) to add the export.

6. **Vitest + Prisma import issues:** Vitest might have trouble with Prisma's generated client in ESM mode. If you hit import errors, try adding `resolve.alias` in vitest config or using `--pool=forks` flag.

7. **Filter UI state management:** TaskFilters and TaskSort manage their own state but must communicate with the parent (TaskListPage) which passes to the hook. Use controlled components with `onChange` callbacks — don't manage filter state inside the hook.

---

## Decision Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Filter implementation | Server-side via Prisma where/orderBy | Client-side filter/sort after fetch | PRD explicitly forbids client-side filtering. Server-side scales better. |
| Dashboard stats | Prisma groupBy + separate overdue query | Single query with application-level aggregation | groupBy is SQL-level aggregation — faster and correct. Separate overdue query for relations. |
| Test DB strategy | `prisma db push --force-reset` with file:./test.db | In-memory SQLite, Docker test container | File-based is simplest. `--force-reset` gives clean state. No Docker dependency. |
| Test data setup | Chain within describe (register → create → test) | Seed script, factory functions | Matches BUILD_RULES.md pattern exactly. Tests are self-contained. |
| Sort default | `createdAt desc` when no sortBy specified | No default (undefined order), `updatedAt desc` | Most intuitive — newest tasks first. Stable ordering prevents flaky UI. |
| Dashboard refresh | On-demand (fetch on page load) | Polling interval, real-time WebSocket | REST-only spec. No WebSocket. On-demand is sufficient for task counts. |
