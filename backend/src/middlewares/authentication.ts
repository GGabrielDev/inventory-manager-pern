import { NextFunction, Request, Response } from 'express'

import { verifyToken } from '@/utils/auth-utils'

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    res.status(403).json({ message: 'Invalid token' })
  }
}
