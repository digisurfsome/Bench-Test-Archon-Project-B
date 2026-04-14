import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      teamRole?: string
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
