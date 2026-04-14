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
      .send({ email: 'auth-test@test.com', name: 'Auth Test User', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toHaveProperty('email', 'auth-test@test.com')
    expect(res.body.user).not.toHaveProperty('password')
    token = res.body.token
  })

  it('POST /auth/register returns 409 for duplicate email', async () => {
    const res = await supertest(app)
      .post('/auth/register')
      .send({ email: 'auth-test@test.com', name: 'Duplicate', password: 'password123' })

    expect(res.status).toBe(409)
  })

  it('POST /auth/login returns JWT for valid credentials', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .send({ email: 'auth-test@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('POST /auth/login returns 401 for invalid credentials', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .send({ email: 'auth-test@test.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('GET /auth/me returns current user with valid JWT', async () => {
    const res = await supertest(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('email', 'auth-test@test.com')
    expect(res.body).not.toHaveProperty('password')
  })

  it('GET /auth/me returns 401 without JWT', async () => {
    const res = await supertest(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})
