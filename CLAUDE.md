# Team Task Manager

A benchmark-quality full-stack team task management web app. Users register, form teams with OWNER/MEMBER roles, create and assign tasks, track them through a TODO→IN_PROGRESS→REVIEW→DONE workflow, filter/sort by assignee/status/priority/due date, and monitor progress on a dashboard with overdue highlighting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Testing | Vitest + supertest |
| Dev | concurrently (runs both servers) |

## Architecture Principles

1. **Single responsibility per file/component.** One module = one concern.
2. **Service layer access only.** Routes → services → Prisma. Routes NEVER call Prisma directly.
3. **Boundary validation at every entry point.** Zod schemas validate all API inputs.
4. **Separation of concerns:** `routes/` (HTTP) → `services/` (logic) → `lib/prisma.ts` (data).
5. **TypeScript strict mode.** No `any` types anywhere.
6. **Forward-only status workflow.** TODO→IN_PROGRESS→REVIEW→DONE. No backward transitions.
7. **Proper HTTP status codes.** 400/401/403/404/409/500 with structured error messages.

## File Structure

```
├── package.json                          # Root monorepo config
├── tsconfig.json                         # Shared TypeScript config (strict)
├── .env                                  # DATABASE_URL + JWT_SECRET
├── prisma/
│   └── schema.prisma                     # 4 models, 3 enums, relations
├── server/
│   ├── tsconfig.json                     # Server TS config
│   ├── vitest.config.ts                  # Test runner config
│   └── src/
│       ├── index.ts                      # Express app entry point
│       ├── lib/
│       │   ├── prisma.ts                 # PrismaClient singleton
│       │   ├── validation.ts             # Zod schemas (auth, task, team)
│       │   └── workflow.ts               # VALID_TRANSITIONS map
│       ├── middleware/
│       │   ├── auth.ts                   # JWT verification middleware
│       │   └── authorization.ts          # OWNER/MEMBER role checks
│       ├── services/
│       │   ├── auth.service.ts           # Register, login, token logic
│       │   ├── task.service.ts           # Task CRUD + filtering + sorting
│       │   ├── team.service.ts           # Team + member management
│       │   └── dashboard.service.ts      # Status counts + overdue detection
│       ├── routes/
│       │   ├── auth.ts                   # POST /auth/register, /login, GET /me
│       │   ├── tasks.ts                  # GET/POST/PUT/DELETE /api/tasks
│       │   ├── teams.ts                  # Team CRUD + member endpoints
│       │   └── dashboard.ts              # GET /api/dashboard
│       └── tests/
│           ├── setup.ts                  # Test DB init/cleanup
│           ├── auth.test.ts              # Auth endpoint tests
│           ├── tasks.test.ts             # Task endpoint tests
│           ├── teams.test.ts             # Team endpoint tests
│           └── dashboard.test.ts         # Dashboard endpoint tests
├── client/
│   ├── index.html                        # Vite HTML entry
│   ├── vite.config.ts                    # Vite + React plugin + API proxy
│   ├── tsconfig.json                     # Client TS config
│   ├── tailwind.config.ts                # Tailwind configuration
│   ├── postcss.config.js                 # PostCSS for Tailwind
│   └── src/
│       ├── main.tsx                      # React DOM render
│       ├── main.css                      # Tailwind imports
│       ├── App.tsx                       # Routing + AuthProvider wrapper
│       ├── lib/
│       │   ├── api.ts                    # All API fetch functions
│       │   └── types.ts                  # Shared interfaces (User, Task, Team)
│       ├── context/
│       │   └── AuthContext.tsx            # Auth state (JWT, login, logout)
│       ├── hooks/
│       │   ├── useTasks.ts               # Task fetching + mutations
│       │   ├── useTeams.ts               # Team fetching
│       │   └── useDashboard.ts           # Dashboard stats fetching
│       ├── pages/
│       │   ├── LoginPage.tsx             # Login form
│       │   ├── RegisterPage.tsx          # Registration form
│       │   ├── TaskListPage.tsx          # Task list + filters + sorting
│       │   ├── TaskFormPage.tsx          # Create/edit task form
│       │   ├── TeamsPage.tsx             # Team list + creation
│       │   ├── TeamDetailPage.tsx        # Team members management
│       │   └── DashboardPage.tsx         # Status counts + overdue list
│       └── components/
│           ├── layout/
│           │   └── AppShell.tsx           # Responsive nav/layout wrapper
│           ├── tasks/
│           │   ├── TaskCard.tsx           # Task display card
│           │   ├── StatusBadge.tsx        # Color-coded status + transition
│           │   ├── TaskFilters.tsx        # Filter controls
│           │   └── TaskSort.tsx           # Sort controls
│           ├── teams/
│           │   └── MemberList.tsx         # Team member list
│           └── dashboard/
│               ├── StatusCard.tsx         # Status count card
│               └── OverdueList.tsx        # Overdue tasks with highlighting
```

## Modification Rules

### Immutable After Phase 1
- `prisma/schema.prisma` — frozen after initial definition
- `.env` — environment variables set once
- `CLAUDE.md` — this file
- `BUILD_RULES.md` — build rules

### Phase Progression
- Phase 1 files become read-only in Phase 2
- Phase 1 + 2 files become read-only in Phase 3
- Each phase may only modify files in its `files_allowed` list

### Data Models (4 models, 3 enums)
- **User:** id, email (unique), name, password (bcrypt), createdAt, updatedAt
- **Team:** id, name, createdAt, updatedAt
- **TeamMember:** id, userId, teamId, role (OWNER|MEMBER), unique [userId,teamId]
- **Task:** id, title, description, status, priority, dueDate, assigneeId, teamId, createdAt, updatedAt
- **Status enum:** TODO, IN_PROGRESS, REVIEW, DONE
- **Priority enum:** LOW, MEDIUM, HIGH, URGENT
- **Role enum:** OWNER, MEMBER

## Testing Protocol

- **Framework:** Vitest + supertest
- **Database:** Isolated SQLite test database (NOT dev.db, NOT mocked)
- **Minimum:** 1 happy-path test per API endpoint (12+ tests total)
- **Run:** `cd server && npx vitest run`
- **Auth in tests:** Register user → get JWT → include in Authorization header
