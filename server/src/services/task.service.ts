import { prisma } from '../lib/prisma'
import { isValidTransition } from '../lib/workflow'

export async function createTask(
  data: {
    title: string
    description?: string
    priority: string
    dueDate?: string | null
    assigneeId?: string | null
    teamId: string
  },
  userId: string
) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: data.teamId } }
  })
  if (!membership) throw { status: 403, message: 'Not a team member' }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      teamId: data.teamId,
      status: 'TODO',
    },
    include: { assignee: { select: { id: true, email: true, name: true } }, team: true }
  })
}

export async function getTasks(
  userId: string,
  filters: {
    status?: string
    priority?: string
    assigneeId?: string
    dueDate?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true }
  })
  const teamIds = memberships.map((m: { teamId: string }) => m.teamId)

  const where: Record<string, unknown> = { teamId: { in: teamIds } }
  if (filters.status) where.status = filters.status
  if (filters.priority) where.priority = filters.priority
  if (filters.assigneeId) where.assigneeId = filters.assigneeId
  if (filters.dueDate) {
    const parsedDate = new Date(filters.dueDate)
    if (isNaN(parsedDate.getTime())) {
      throw { status: 400, message: 'Invalid dueDate filter value' }
    }
    where.dueDate = { lte: parsedDate }
  }

  // Whitelist allowed sort fields to prevent Prisma key injection
  const ALLOWED_SORT_FIELDS = ['priority', 'dueDate', 'createdAt', 'updatedAt', 'title', 'status'] as const
  type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number]

  const orderBy: Record<string, string> = {}
  if (filters.sortBy) {
    if (!ALLOWED_SORT_FIELDS.includes(filters.sortBy as AllowedSortField)) {
      throw { status: 400, message: `Invalid sortBy field. Allowed: ${ALLOWED_SORT_FIELDS.join(', ')}` }
    }
    const field = filters.sortBy as AllowedSortField
    orderBy[field] = filters.sortOrder === 'asc' ? 'asc' : 'desc'
  } else {
    orderBy.createdAt = 'desc'
  }

  return prisma.task.findMany({
    where,
    orderBy,
    include: { assignee: { select: { id: true, email: true, name: true } }, team: true }
  })
}

export async function getTask(id: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, email: true, name: true } }, team: true }
  })
  if (!task) throw { status: 404, message: 'Task not found' }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: task.teamId } }
  })
  if (!membership) throw { status: 403, message: 'Not a team member' }

  return task
}

export async function updateTask(
  id: string,
  data: {
    title?: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string | null
    assigneeId?: string | null
  },
  userId: string
) {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) throw { status: 404, message: 'Task not found' }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: task.teamId } }
  })
  if (!membership) throw { status: 403, message: 'Not a team member' }

  if (data.status && data.status !== task.status) {
    if (!isValidTransition(task.status, data.status)) {
      throw { status: 400, message: `Invalid status transition from ${task.status} to ${data.status}` }
    }
  }

  return prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
    },
    include: { assignee: { select: { id: true, email: true, name: true } }, team: true }
  })
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) throw { status: 404, message: 'Task not found' }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: task.teamId } }
  })
  if (!membership) throw { status: 403, message: 'Not a team member' }

  return prisma.task.delete({ where: { id } })
}
