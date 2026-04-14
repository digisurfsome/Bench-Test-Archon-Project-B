import { prisma } from '../lib/prisma'
import { Request, Response, NextFunction } from 'express'

export function requireTeamRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const teamId = req.params.teamId || req.params.id || req.body.teamId
    if (!teamId) {
      res.status(400).json({ error: 'Team ID required' })
      return
    }

    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: req.userId!, teamId } }
    })
    if (!member) {
      res.status(403).json({ error: 'Not a team member' })
      return
    }
    if (roles.length > 0 && !roles.includes(member.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    req.teamRole = member.role
    next()
  }
}
