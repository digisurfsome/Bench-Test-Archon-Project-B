# Phase 2: Core Features — Enriched with Implementation Intelligence

> **Mechanisms:** mech_004 (Task CRUD), mech_005 (Team Management), mech_006 (Role-Based Authorization), mech_007 (Task Status Workflow)
> **Estimated tokens:** 105,000 content + 25,000 overhead
> **Dependencies:** Phase 1 (Foundation) — all Phase 1 files are READ-ONLY
> **Enrichment source:** Greptacular React hooks + BUILD_RULES.md canonical patterns

---

## Patterns to Mirror

### PATTERN 1: Service Layer CRUD (from BUILD_RULES.md)
**SOURCE:** BUILD_RULES.md:119-127
```typescript
// server/src/services/task.service.ts
export async function createTask(data: CreateTaskInput, userId: string) {
  // 1. Verify user is member of data.teamId
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: data.teamId } }
  })
  if (!membership) throw { status: 403, message: 'Not a team member' }
  
  // 2. Create with default status
  return prisma.task.create({
    data: { ...data, status: 'TODO' },
    include: { assignee: true, team: true }
  })
}
```
**Use in:** All 4 CRUD functions in `task.service.ts` and all team functions in `team.service.ts`.

### PATTERN 2: Workflow State Machine (from BUILD_RULES.md)
**SOURCE:** BUILD_RULES.md:147-157
```typescript
// server/src/lib/workflow.ts
export const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['REVIEW'],
  REVIEW: ['DONE'],
  DONE: [],
}

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
```
**Use in:** `server/src/lib/workflow.ts` — copy exactly. Called by `task.service.ts` during status updates.

### PATTERN 3: Authorization Middleware
**SOURCE:** Derived from auth middleware pattern in Phase 1
```typescript
// server/src/middleware/authorization.ts
import { prisma } from '../lib/prisma'
import { Request, Response, NextFunction } from 'express'

export function requireTeamRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const teamId = req.params.teamId || req.body.teamId
    if (!teamId) return res.status(400).json({ error: 'Team ID required' })
    
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: req.userId!, teamId } }
    })
    if (!member) return res.status(403).json({ error: 'Not a team member' })
    if (roles.length > 0 && !roles.includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    req.teamRole = member.role  // Attach for downstream use
    next()
  }
}
```
**Use in:** `server/src/middleware/authorization.ts`. Apply to routes: `router.post('/teams/:teamId/members', auth, requireTeamRole('OWNER'), ...)`.

### PATTERN 4: TanStack Query Mutation Hook (from Greptacular)
**SOURCE:** Greptacular `ui/src/hooks/useProjects.ts:30-50`
```typescript
// client/src/hooks/useTasks.ts — adapt this pattern
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'

export function useTasks(teamId?: string) {
  return useQuery({
    queryKey: ['tasks', teamId],
    queryFn: () => api.getTasks(teamId),
    enabled: !!teamId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskInput) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```
**Use in:** `client/src/hooks/useTasks.ts` and `client/src/hooks/useTeams.ts`.

### PATTERN 5: Prisma Conditional Filter (from BUILD_RULES.md)
**SOURCE:** BUILD_RULES.md:104-110
```typescript
// Used in task.service.ts getTasks
const where: Prisma.TaskWhereInput = { teamId }
if (status) where.status = status as Status
if (priority) where.priority = priority as Priority
if (assigneeId) where.assigneeId = assigneeId

const tasks = await prisma.task.findMany({
  where,
  include: { assignee: true, team: true },
  orderBy: { createdAt: 'desc' }
})
```
**Use in:** `task.service.ts` getTasks function. Phase 3 will extend this with full filter/sort support.

---

## Mandatory Reading (Priority-Ordered)

### P0 — Must Read Before Writing Any Code
| File | Why |
|------|-----|
| Phase 1 `server/src/middleware/auth.ts` | Auth middleware you'll apply to all routes — READ-ONLY |
| Phase 1 `server/src/lib/prisma.ts` | Prisma client singleton you'll import — READ-ONLY |
| Phase 1 `server/src/services/auth.service.ts` | Pattern to follow for service functions — READ-ONLY |
| Phase 1 `client/src/context/AuthContext.tsx` | Auth state you'll consume in hooks — READ-ONLY |

### P1 — Read When Building Specific Files
| File | When |
|------|------|
| Phase 1 `server/src/lib/validation.ts` | Before ADDING task/team schemas (you modify this file) |
| Phase 1 `client/src/lib/api.ts` | Before ADDING task/team API functions (you modify this file) |
| Phase 1 `client/src/lib/types.ts` | Before ADDING Task/Team types (you modify this file) |
| Phase 1 `client/src/App.tsx` | Before ADDING routes (you modify this file) |

---

## Per-File Implementation Details

### 1. `server/src/lib/validation.ts` (MODIFY — add to existing)
**Add these schemas alongside existing auth schemas:**
```typescript
export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().min(1),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

export const createTeamSchema = z.object({
  name: z.string().min(1),
})

export const addMemberSchema = z.object({
  userId: z.string().min(1),
})
```

### 2. `server/src/lib/workflow.ts` (CREATE)
Copy PATTERN 2 exactly. This is a WALL — must match the spec's forward-only transitions.

### 3. `server/src/services/task.service.ts` (CREATE)
**Exports:** `createTask`, `getTasks`, `getTask`, `updateTask`, `deleteTask`
- `createTask`: verify team membership → create with status TODO → return with relations
- `getTasks`: accept teamId filter → findMany with includes → return array
- `getTask`: findUnique by id → 404 if not found → return with relations
- `updateTask`: find task → verify team membership → if status change, validate transition → update → return
- `deleteTask`: find task → verify team membership → delete → return

**Critical:** Status changes go through `isValidTransition()`. Invalid transitions return 400.

### 4. `server/src/services/team.service.ts` (CREATE)
**Exports:** `createTeam`, `getTeams`, `getTeam`, `addMember`, `removeMember`
- `createTeam(name, userId)`: create team → create TeamMember with role OWNER for creator → return team
- `getTeams(userId)`: findMany where user is a member → return with member counts
- `getTeam(teamId)`: findUnique → include members with user data → return
- `addMember(teamId, userId, requesterId)`: verify requester is OWNER → check user not already member → create TeamMember with MEMBER role
- `removeMember(teamId, memberId, requesterId)`: verify requester is OWNER → delete TeamMember

**WALL:** Creator auto-assigned OWNER. This is verified in pulse checks.

### 5. `server/src/middleware/authorization.ts` (CREATE)
Use PATTERN 3 above. The middleware is a factory function `requireTeamRole(...roles)` that returns middleware.

**Gotcha:** `teamId` might come from different places:
- Route params: `req.params.teamId` or `req.params.id`
- Request body: `req.body.teamId`
- The middleware should check both. Normalize early.

### 6. `server/src/routes/tasks.ts` (CREATE)
```typescript
import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as taskService from '../services/task.service'
import { createTaskSchema, updateTaskSchema } from '../lib/validation'

const router = Router()

router.use(auth)  // All task routes require authentication

router.get('/', async (req, res) => { /* getTasks with team scope */ })
router.post('/', async (req, res) => { /* validate → createTask */ })
router.put('/:id', async (req, res) => { /* validate → updateTask */ })
router.delete('/:id', async (req, res) => { /* deleteTask */ })

export default router
```
**Mount in index.ts:** `app.use('/api/tasks', tasksRouter)`

### 7. `server/src/routes/teams.ts` (CREATE)
```typescript
router.use(auth)

router.get('/', async (req, res) => { /* getTeams for current user */ })
router.post('/', async (req, res) => { /* validate → createTeam */ })
router.get('/:id', async (req, res) => { /* getTeam with members */ })
router.post('/:id/members', async (req, res) => { /* OWNER only → addMember */ })
router.delete('/:id/members/:memberId', async (req, res) => { /* OWNER only → removeMember */ })
```
**Mount in index.ts:** `app.use('/api/teams', teamsRouter)`

### 8. `client/src/lib/types.ts` (MODIFY — add to existing)
```typescript
export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  assigneeId: string | null
  teamId: string
  createdAt: string
  updatedAt: string
  assignee?: User | null
  team?: Team
}

export interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  members?: TeamMember[]
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: 'OWNER' | 'MEMBER'
  user?: User
}

export type CreateTaskInput = {
  title: string
  description?: string
  priority: Task['priority']
  dueDate?: string | null
  assigneeId?: string | null
  teamId: string
}
```

### 9. `client/src/lib/api.ts` (MODIFY — add to existing)
Add task and team API functions using the existing `fetchJSON` wrapper:
```typescript
export async function createTask(data: CreateTaskInput): Promise<Task> {
  return fetchJSON('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
}
export async function getTasks(teamId?: string): Promise<Task[]> {
  const params = teamId ? `?teamId=${teamId}` : ''
  return fetchJSON(`/api/tasks${params}`)
}
export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return fetchJSON(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteTask(id: string): Promise<void> {
  return fetchJSON(`/api/tasks/${id}`, { method: 'DELETE' })
}
// Similar for teams...
```

### 10-18. React Pages & Components
All UI files are ROOM classification — flexible implementation. Key requirements:
- **TaskListPage:** Renders list of TaskCard components. Uses `useTasks` hook. Link to create new task.
- **TaskFormPage:** Create and edit modes (check for `:id` param). Controlled form with all fields.
- **TaskCard:** Displays title, status (via StatusBadge), priority, assignee, due date.
- **StatusBadge:** Color-coded badge. Shows "Advance" button for next valid transition.
- **TeamsPage:** Lists teams. Create new team form.
- **TeamDetailPage:** Shows members via MemberList. Add/remove for OWNERs.
- **MemberList:** Renders member name + role badge.

**Pattern from Greptacular pages:** Use `max-w-5xl mx-auto px-4 py-6` for centered layout. Early return for loading states. Responsive grids.

---

## Gotchas

1. **Authorization middleware vs service-level checks:** The PRD says "NO authorization logic in route handlers." This means either use middleware OR put checks in the service layer — but don't inline `if (role !== 'OWNER')` in route handlers. Middleware is cleaner for routes, service checks for complex business rules.

2. **TeamMember compound unique key:** Prisma's compound unique on `[userId, teamId]` means you query with: `prisma.teamMember.findUnique({ where: { userId_teamId: { userId, teamId } } })`. The auto-generated name is `userId_teamId`.

3. **Task scoping:** GET `/api/tasks` should return tasks from ALL teams the user is a member of, not just one team. Query: find all teamIds for user → findMany tasks where teamId in [...userTeamIds].

4. **StatusBadge transition buttons:** The component needs to know the VALID_TRANSITIONS map (or at least the next valid status). Either import the map client-side or have the API return `nextStatus` alongside each task.

5. **React Router nested routes:** When adding task/team routes in App.tsx, wrap authenticated routes inside an AppShell layout route so the nav persists across pages.

6. **Phase 1 files are READ-ONLY:** You may READ `prisma.ts`, `auth.ts`, `auth.service.ts`, `AuthContext.tsx`, `AppShell.tsx` but CANNOT modify them. If you find a Phase 1 bug, document it — don't fix it.

---

## Decision Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Authorization pattern | Middleware factory `requireTeamRole(...roles)` | Service-layer checks, decorator pattern | Middleware keeps routes clean. Factory supports OWNER-only and any-member variants. |
| Task scoping | User's team memberships → all tasks from those teams | Single team filter required | PRD says "tasks scoped to user's team memberships" — implies multi-team. |
| Hook library | TanStack Query (useQuery/useMutation) | useState+useEffect, SWR, Zustand | Cache invalidation, loading/error states, refetch on focus — all built in. Greptacular uses this pattern successfully. |
| Status transitions client-side | Hardcode VALID_TRANSITIONS map in a client util | API returns nextStatus, compute from enum order | Keeps client in sync with server. Small duplication is acceptable for a 4-state machine. |
| Form mode (create/edit) | Single TaskFormPage checks URL for `:id` param | Separate CreateTaskPage and EditTaskPage | DRY. Same form, different initial data and submit handler. Standard React pattern. |
