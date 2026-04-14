import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { app } from '../index'
import { setupTestDb, teardownTestDb } from './setup'

describe('Task endpoints', () => {
  let token: string
  let teamId: string
  let taskId: string

  beforeAll(async () => {
    await setupTestDb()

    // Register user
    const userRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'tasks-test@test.com', name: 'Tasks Test User', password: 'password123' })
    token = userRes.body.token

    // Create team
    const teamRes = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Team' })
    teamId = teamRes.body.id
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('POST /api/tasks creates task with status TODO', async () => {
    const res = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', priority: 'MEDIUM', teamId })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Test Task')
    expect(res.body.status).toBe('TODO')
    expect(res.body.priority).toBe('MEDIUM')
    taskId = res.body.id
  })

  it('GET /api/tasks returns task list', async () => {
    const res = await supertest(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('PUT /api/tasks/:id advances status TODO->IN_PROGRESS', async () => {
    const res = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('IN_PROGRESS')
  })

  it('PUT /api/tasks/:id rejects invalid status transition', async () => {
    const res = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'TODO' })

    expect(res.status).toBe(400)
  })

  it('DELETE /api/tasks/:id deletes task', async () => {
    const res = await supertest(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  it('GET /api/tasks returns 401 without JWT', async () => {
    const res = await supertest(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })
})

describe('Workflow state transitions', () => {
  let token: string
  let teamId: string
  let taskId: string

  beforeAll(async () => {
    await setupTestDb()

    const userRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'workflow-test@test.com', name: 'Workflow User', password: 'password123' })
    token = userRes.body.token

    const teamRes = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Workflow Team' })
    teamId = teamRes.body.id
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('walks a task through all valid states: TODO -> IN_PROGRESS -> REVIEW -> DONE', async () => {
    // Create task (starts as TODO)
    const createRes = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Workflow Task', priority: 'MEDIUM', teamId })
    expect(createRes.status).toBe(201)
    taskId = createRes.body.id

    // TODO -> IN_PROGRESS
    const step1 = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })
    expect(step1.status).toBe(200)
    expect(step1.body.status).toBe('IN_PROGRESS')

    // IN_PROGRESS -> REVIEW
    const step2 = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REVIEW' })
    expect(step2.status).toBe(200)
    expect(step2.body.status).toBe('REVIEW')

    // REVIEW -> DONE
    const step3 = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })
    expect(step3.status).toBe(200)
    expect(step3.body.status).toBe('DONE')
  })

  it('rejects advancing from DONE (terminal state)', async () => {
    const res = await supertest(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'TODO' })
    expect(res.status).toBe(400)
  })

  it('rejects skipping states: TODO -> REVIEW', async () => {
    const createRes = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Skip Task', priority: 'LOW', teamId })
    const skipTaskId = createRes.body.id

    const res = await supertest(app)
      .put(`/api/tasks/${skipTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REVIEW' })
    expect(res.status).toBe(400)
  })

  it('rejects skipping states: TODO -> DONE', async () => {
    const createRes = await supertest(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Skip Task 2', priority: 'LOW', teamId })
    const skipTaskId = createRes.body.id

    const res = await supertest(app)
      .put(`/api/tasks/${skipTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })
    expect(res.status).toBe(400)
  })
})

describe('sortBy validation', () => {
  let token: string

  beforeAll(async () => {
    await setupTestDb()

    const userRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'sort-test@test.com', name: 'Sort User', password: 'password123' })
    token = userRes.body.token
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('rejects invalid sortBy field with 400', async () => {
    const res = await supertest(app)
      .get('/api/tasks?sortBy=password')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
  })

  it('accepts valid sortBy field', async () => {
    const res = await supertest(app)
      .get('/api/tasks?sortBy=createdAt&sortOrder=asc')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })
})
