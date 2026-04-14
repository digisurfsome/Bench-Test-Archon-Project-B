import { Router } from 'express'
import { auth } from '../middleware/auth'
import * as taskService from '../services/task.service'
import { createTaskSchema, updateTaskSchema } from '../lib/validation'

const router = Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const { status, priority, assigneeId, dueDate, sortBy, sortOrder } = req.query
    const tasks = await taskService.getTasks(req.userId!, {
      status: status as string | undefined,
      priority: priority as string | undefined,
      assigneeId: assigneeId as string | undefined,
      dueDate: dueDate as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as string | undefined,
    })
    res.json(tasks)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const task = await taskService.createTask(parsed.data, req.userId!)
    res.status(201).json(task)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const task = await taskService.getTask(req.params.id, req.userId!)
    res.json(task)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }
  try {
    const task = await taskService.updateTask(req.params.id, parsed.data, req.userId!)
    res.json(task)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.userId!)
    res.json({ message: 'Task deleted' })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    res.status(e.status || 500).json({ error: e.message || 'Internal server error' })
  }
})

export default router
