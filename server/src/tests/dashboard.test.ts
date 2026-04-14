import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { app } from '../index'
import { setupTestDb, teardownTestDb } from './setup'

describe('Dashboard endpoints', () => {
  let token: string

  beforeAll(async () => {
    await setupTestDb()

    const userRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'dashboard-test@test.com', name: 'Dashboard User', password: 'password123' })
    token = userRes.body.token

    const teamRes = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dashboard Team' })
    const teamId = teamRes.body.id

    // Create tasks
    await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 1', priority: 'HIGH', teamId })

    await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 2', priority: 'LOW', teamId })
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('GET /api/dashboard returns status counts and overdue tasks', async () => {
    const res = await supertest(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('statusCounts')
    expect(res.body).toHaveProperty('overdueTasks')
    expect(res.body.statusCounts).toHaveProperty('TODO')
    expect(res.body.statusCounts).toHaveProperty('IN_PROGRESS')
    expect(res.body.statusCounts).toHaveProperty('REVIEW')
    expect(res.body.statusCounts).toHaveProperty('DONE')
    expect(Array.isArray(res.body.overdueTasks)).toBe(true)
  })

  it('GET /api/dashboard returns 401 without JWT', async () => {
    const res = await supertest(app).get('/api/dashboard')
    expect(res.status).toBe(401)
  })
})

describe('Dashboard overdue detection', () => {
  let token: string

  beforeAll(async () => {
    await setupTestDb()

    const userRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'overdue-test@test.com', name: 'Overdue User', password: 'password123' })
    token = userRes.body.token

    const teamRes = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Overdue Team' })
    const teamId = teamRes.body.id

    // Create an overdue task (due date in the past, status TODO)
    await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Overdue Task',
        priority: 'HIGH',
        teamId,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
      })

    // Create a DONE task with past due date (should NOT appear in overdue)
    const doneTaskRes = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Done Past Due',
        priority: 'LOW',
        teamId,
        dueDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      })
    // Advance through workflow to DONE
    const doneTaskId = doneTaskRes.body.id
    await supertest(app)
      .put(`/api/tasks/${doneTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })
    await supertest(app)
      .put(`/api/tasks/${doneTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REVIEW' })
    await supertest(app)
      .put(`/api/tasks/${doneTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })

    // Create a task with no due date (should NOT appear in overdue)
    await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No Due Date', priority: 'MEDIUM', teamId })
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('returns overdue non-DONE tasks and excludes DONE tasks', async () => {
    const res = await supertest(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.overdueTasks.length).toBe(1)
    expect(res.body.overdueTasks[0].title).toBe('Overdue Task')
  })
})
