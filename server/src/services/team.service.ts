import { prisma } from '../lib/prisma'

export async function createTeam(name: string, userId: string) {
  const team = await prisma.team.create({
    data: {
      name,
      members: {
        create: { userId, role: 'OWNER' }
      }
    },
    include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } }
  })
  return team
}

export async function getTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: { some: { userId } }
    },
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } }
    }
  })
}

export async function getTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } }
    }
  })
  if (!team) throw { status: 404, message: 'Team not found' }

  const membership = team.members.find(m => m.userId === userId)
  if (!membership) throw { status: 403, message: 'Not a team member' }

  return team
}

export async function addMember(teamId: string, newUserId: string, requesterId: string) {
  const requester = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: requesterId, teamId } }
  })
  if (!requester || requester.role !== 'OWNER') {
    throw { status: 403, message: 'Only team owners can add members' }
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: newUserId, teamId } }
  })
  if (existing) throw { status: 409, message: 'User is already a team member' }

  const user = await prisma.user.findUnique({ where: { id: newUserId } })
  if (!user) throw { status: 404, message: 'User not found' }

  return prisma.teamMember.create({
    data: { userId: newUserId, teamId, role: 'MEMBER' },
    include: { user: { select: { id: true, email: true, name: true } } }
  })
}

export async function removeMember(teamId: string, memberId: string, requesterId: string) {
  const requester = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: requesterId, teamId } }
  })
  if (!requester || requester.role !== 'OWNER') {
    throw { status: 403, message: 'Only team owners can remove members' }
  }

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } })
  if (!member || member.teamId !== teamId) {
    throw { status: 404, message: 'Member not found' }
  }

  // Prevent removing the last OWNER -- would orphan the team with no admin recovery path
  if (member.role === 'OWNER') {
    const ownerCount = await prisma.teamMember.count({
      where: { teamId, role: 'OWNER' }
    })
    if (ownerCount <= 1) {
      throw { status: 400, message: 'Cannot remove the last team owner' }
    }
  }

  return prisma.teamMember.delete({ where: { id: memberId } })
}
