import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as teamService from '../services/team.service'
import { createTeamSchema, addMemberSchema } from '../lib/validation'

const router = Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const teams = await teamService.getTeams(req.userId!)
    res.json(teams)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const parsed = createTeamSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const team = await teamService.createTeam(parsed.data.name, req.userId!)
    res.status(201).json(team)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const team = await teamService.getTeam(req.params.id, req.userId!)
    res.json(team)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.post('/:id/members', async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const member = await teamService.addMember(req.params.id, parsed.data.userId, req.userId!)
    res.status(201).json(member)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await teamService.removeMember(req.params.id, req.params.memberId, req.userId!)
    res.json({ message: 'Member removed' })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

export default router
