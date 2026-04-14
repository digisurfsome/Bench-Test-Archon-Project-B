import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as authService from '../services/auth.service'
import { registerSchema, loginSchema } from '../lib/validation'

const router = Router()

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const result = await authService.register(parsed.data)
    res.status(201).json(result)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const result = await authService.login(parsed.data)
    res.json(result)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.get('/me', auth, async (req, res) => {
  try {
    const user = await authService.getMe(req.userId!)
    res.json(user)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

export default router
