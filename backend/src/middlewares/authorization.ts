import { NextFunction, Request, Response } from 'express'

import { Role } from '@/models'
import User from '@/models/User'

export function requirePermission(permissionName: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId
      if (userId === undefined || userId === null) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Make sure to include roles and permissions
      const user = await User.findByPk(userId, {
        include: [
          {
            association: User.RELATIONS.ROLES,
            include: [Role.RELATIONS.PERMISSIONS],
          },
        ],
      })

      if (!user) {
        res.status(401).json({ error: 'User not found' })
        return
      }

      // Defensive: handle missing roles or permissions
      const roles = user.roles || []
      const hasPermission = roles.some((role) =>
        (role.permissions || []).some(
          (perm: any) => perm.name === permissionName
        )
      )

      if (!hasPermission) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
