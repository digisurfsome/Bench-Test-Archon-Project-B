# Team Task Manager

A benchmark-quality full-stack web app for team-based task management. Built with React 18 + Express + TypeScript + Prisma + SQLite.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite via Prisma ORM
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Testing:** Vitest + supertest

## Install & Run

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Run both servers (Vite + Express)
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Phase Overview

### Phase 1: Foundation
- Monorepo scaffolding (Vite + Express + TypeScript)
- Database schema (4 models: User, Team, TeamMember, Task; 3 enums)
- Prisma + SQLite setup with migrations
- Input validation with Zod
- Responsive UI shell with Tailwind CSS (375px mobile + desktop)
- User authentication (register, login, JWT, bcrypt)
- Auth context and protected routes

**Files:** 22 | **Mechanisms:** mech_001, mech_002, mech_011, mech_010, mech_003

### Phase 2: Core Features
- Full task CRUD (create, read, update, delete)
- Team management (create, list, add/remove members)
- Role-based authorization (OWNER/MEMBER permissions)
- Task status workflow (TODO → IN_PROGRESS → REVIEW → DONE, forward-only)
- Task and team React pages with hooks

**Files:** 19 | **Mechanisms:** mech_004, mech_005, mech_006, mech_007

### Phase 3: Discovery, Dashboard & Testing
- Task filtering (status, priority, assignee, due date)
- Task sorting (priority, due date, created date)
- Dashboard with task counts by status
- Overdue task highlighting
- Vitest test suite (12+ tests covering all API endpoints)

**Files:** 21 | **Mechanisms:** mech_008, mech_009, mech_012

## Post-Build Checklist

- [ ] `npm install` completes without errors
- [ ] `npx prisma migrate dev` creates database
- [ ] `npm run dev` starts both servers
- [ ] Register a new user via the UI
- [ ] Login with the registered user
- [ ] Create a team
- [ ] Add a member to the team
- [ ] Create a task assigned to a team member
- [ ] Advance task through TODO → IN_PROGRESS → REVIEW → DONE
- [ ] Verify backward transitions are rejected
- [ ] Filter tasks by status, priority
- [ ] Sort tasks by due date
- [ ] View dashboard with status counts
- [ ] Verify overdue tasks are highlighted
- [ ] Check responsive layout at 375px width
- [ ] `cd server && npx vitest run` — all tests pass
- [ ] `cd server && npx tsc --noEmit` — zero TS errors
- [ ] `cd client && npx tsc --noEmit` — zero TS errors

## Data Models

| Model | Key Fields |
|-------|-----------|
| User | id, email (unique), name, password (hashed), timestamps |
| Team | id, name, timestamps |
| TeamMember | id, userId, teamId, role (OWNER/MEMBER), unique [userId,teamId] |
| Task | id, title, description, status, priority, dueDate, assigneeId, teamId, timestamps |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, get JWT |
| GET | /auth/me | Yes | Get current user |
| POST | /api/teams | Yes | Create team |
| GET | /api/teams | Yes | List user's teams |
| POST | /api/teams/:id/members | Yes (OWNER) | Add team member |
| DELETE | /api/teams/:id/members/:mid | Yes (OWNER) | Remove team member |
| POST | /api/tasks | Yes | Create task |
| GET | /api/tasks | Yes | List tasks (with filters/sort) |
| PUT | /api/tasks/:id | Yes | Update task |
| DELETE | /api/tasks/:id | Yes | Delete task |
| GET | /api/dashboard | Yes | Status counts + overdue tasks |
