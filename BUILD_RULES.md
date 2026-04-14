# BUILD_RULES.md — Team Task Manager

## Debugging Protocol

**Trace-first approach.** When something fails:

1. **Read the error message.** The actual error, not your assumption about what went wrong.
2. **Trace the data flow.** Route handler → validation → service → Prisma → response. Find where the data diverges from expectation.
3. **Check the seams.** Most bugs are at connection points between files:
   - Import resolution (wrong path, wrong export name)
   - Type mismatches (service returns X, route expects Y)
   - Missing middleware (auth or authorization not applied)
4. **Fix the root cause.** Don't add workarounds. If the service returns the wrong shape, fix the service — don't reshape in the route.
5. **Verify the fix doesn't break other consumers.** Run the full compile check after every fix.

**Never:**
- Add `try/catch` that swallows errors silently
- Add `as any` to fix type errors
- Comment out failing code
- Add console.log as permanent debugging (remove after use)

## Feature Addition Protocol

When adding a new feature (filter, sort field, dashboard metric, etc.):

1. **Start at the service layer.** Define the function signature and business logic first.
2. **Add the route.** Wire the service to an HTTP endpoint. Apply auth/authorization middleware.
3. **Add validation.** Define Zod schema for any new input. Add to `validation.ts`.
4. **Add the API client function.** Export from `client/src/lib/api.ts`.
5. **Add the hook.** Create or update the relevant `use*.ts` hook.
6. **Add the UI.** Build/update the component that uses the hook.
7. **Update types.** If new data shapes exist, add to `client/src/lib/types.ts`.

**Order matters.** Build bottom-up (data → logic → transport → UI). Never build UI first.

## Testing and Verification Rules

### Test Database
- Tests use an isolated SQLite database — never `dev.db`
- `server/src/tests/setup.ts` handles test DB creation and cleanup
- Each test suite gets a clean database state via beforeAll/afterAll

### Test Structure
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { app } from '../index'  // or however the Express app is exported
import { setupTestDb, teardownTestDb } from './setup'

describe('POST /api/tasks', () => {
  let token: string

  beforeAll(async () => {
    await setupTestDb()
    // Register a user and get JWT for authenticated requests
    const res = await supertest(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', name: 'Test', password: 'password123' })
    token = res.body.token
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('creates a task with valid data', async () => {
    const res = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', priority: 'MEDIUM', teamId: '...' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Test Task')
    expect(res.body.status).toBe('TODO')
  })
})
```

### What to Test
- **Happy path:** Valid input → correct response status + body
- **Auth:** Protected routes return 401 without JWT
- **Authorization:** MEMBER can't perform OWNER-only operations (403)
- **Validation:** Malformed input returns 400 with error message
- **Workflow:** Invalid status transitions return 400

### Never in Tests
- Mock the database (use real SQLite test DB)
- Use `dev.db` (use isolated test DB)
- Skip auth in test requests (always include JWT)
- Use `any` types in test code

## Data Access Patterns

### Prisma Singleton
```typescript
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

All services import `prisma` from this single file. Never create additional PrismaClient instances.

### Query Patterns
```typescript
// Filtering with optional params
const where: Prisma.TaskWhereInput = {}
if (status) where.status = status
if (priority) where.priority = priority
if (assigneeId) where.assigneeId = assigneeId

const tasks = await prisma.task.findMany({ where, orderBy })
```

### Relations
- Include relations explicitly: `include: { assignee: true, team: true }`
- Never return password fields: `select: { password: false }` or omit from response

## Entity CRUD Patterns

### Service Layer
```typescript
// server/src/services/task.service.ts
export async function createTask(data: CreateTaskInput, userId: string) {
  // 1. Validate business rules (team membership, etc.)
  // 2. Apply defaults (status: TODO)
  // 3. Prisma create
  // 4. Return created entity
}
```

### Route Layer
```typescript
// server/src/routes/tasks.ts
router.post('/', auth, async (req, res) => {
  // 1. Validate input with Zod
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues })
  // 2. Call service
  const task = await taskService.createTask(parsed.data, req.userId)
  // 3. Return response
  res.status(201).json(task)
})
```

### Status Workflow
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

## Error Handling Standards

### HTTP Status Codes
| Code | When |
|------|------|
| 200 | Successful read/update/delete |
| 201 | Successful create |
| 400 | Validation failure, invalid status transition |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not authorized (wrong role, not team member) |
| 404 | Entity not found |
| 409 | Conflict (duplicate email on registration) |
| 500 | Unexpected server error |

### Error Response Shape
```json
{
  "error": "Short error message",
  "details": [{ "field": "email", "message": "Invalid email format" }]
}
```

### Error Handling in Services
- Services throw typed errors or return result objects
- Routes catch and map to HTTP status codes
- Never expose internal error details (stack traces, SQL) to the client
- Prisma unique constraint violations → 409
- Prisma not found → 404
