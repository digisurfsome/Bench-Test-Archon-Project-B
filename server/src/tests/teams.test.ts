import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { app } from '../index'
import { setupTestDb, teardownTestDb } from './setup'

describe('Team endpoints', () => {
  let ownerToken: string
  let memberToken: string
  let memberId: string
  let teamId: string
  let teamMemberRecordId: string

  beforeAll(async () => {
    await setupTestDb()

    // Register owner
    const ownerRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'teams-owner@test.com', name: 'Team Owner', password: 'password123' })
    ownerToken = ownerRes.body.token

    // Register member
    const memberRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'teams-member@test.com', name: 'Team Member', password: 'password123' })
    memberToken = memberRes.body.token
    memberId = memberRes.body.user.id
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('POST /api/teams creates team and assigns OWNER role', async () => {
    const res = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'My Team' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('My Team')
    expect(res.body.members).toHaveLength(1)
    expect(res.body.members[0].role).toBe('OWNER')
    teamId = res.body.id
  })

  it('GET /api/teams returns user teams', async () => {
    const res = await supertest(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('POST /api/teams/:id/members adds member (OWNER only)', async () => {
    const res = await supertest(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId })

    expect(res.status).toBe(201)
    expect(res.body.role).toBe('MEMBER')
    teamMemberRecordId = res.body.id
  })

  it('POST /api/teams/:id/members returns 403 for non-owner', async () => {
    const res = await supertest(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: memberId })

    expect(res.status).toBe(403)
  })

  it('DELETE /api/teams/:id/members/:memberId removes member', async () => {
    const res = await supertest(app)
      .delete(`/api/teams/${teamId}/members/${teamMemberRecordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
  })
})

describe('Team last-owner protection', () => {
  let ownerToken: string
  let teamId: string
  let ownerMemberRecordId: string

  beforeAll(async () => {
    await setupTestDb()

    const ownerRes = await supertest(app)
      .post('/auth/register')
      .send({ email: 'lastowner-test@test.com', name: 'Last Owner', password: 'password123' })
    ownerToken = ownerRes.body.token

    const teamRes = await supertest(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Orphan Test Team' })
    teamId = teamRes.body.id
    ownerMemberRecordId = teamRes.body.members[0].id
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('prevents removing the last OWNER with 400', async () => {
    const res = await supertest(app)
      .delete(`/api/teams/${teamId}/members/${ownerMemberRecordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('last team owner')
  })
})
