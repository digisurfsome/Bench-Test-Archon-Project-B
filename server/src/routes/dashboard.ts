import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as dashboardService from '../services/dashboard.service'

const router = Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.userId!)
    res.json(stats)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

export default router
