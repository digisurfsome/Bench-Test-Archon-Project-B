import { prisma } from '../lib/prisma'

export async function getDashboardStats(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true }
  })
  const teamIds = memberships.map((m: { teamId: string }) => m.teamId)

  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    where: { teamId: { in: teamIds } },
    _count: { status: true }
  })

  const statusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
    ...Object.fromEntries(statusGroups.map((g: { status: string; _count: { status: number } }) => [g.status, g._count.status]))
  }

  const overdueTasks = await prisma.task.findMany({
    where: {
      teamId: { in: teamIds },
      status: { not: 'DONE' },
      dueDate: { lt: new Date() }
    },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      team: true
    },
    orderBy: { dueDate: 'asc' }
  })

  return { statusCounts, overdueTasks }
}
