import express, { NextFunction, Request, Response } from 'express'
import request from 'supertest'

import { requirePermission } from '@/middlewares/authorization'
import Permission from '@/models/Permission'
import Role from '@/models/Role'
import User from '@/models/User'

const app = express()
app.use(express.json())

// Dummy endpoint for testing
app.get(
  '/test',
  (req: Request, res: Response, next: NextFunction) => {
    // Simulate authentication middleware
    if (req.headers['x-user-id']) {
      ;(req as any).userId = Number(req.headers['x-user-id'])
    }
    next()
  },
  // Wrap async middleware to catch errors
  (req: Request, res: Response, next: NextFunction) =>
    requirePermission('edit_user')(req, res, next),
  (req: Request, res: Response) => {
    res.status(200).json({ message: 'OK' })
  }
)

describe('Authorization Middleware', () => {
  let user: User, role: Role, perm: Permission
  let userId: User['id']

  beforeEach(async () => {
    user = await User.create(
      { username: 'test', passwordHash: 'x' },
      { userId: 0 }
    )
    userId = user.id
    role = await Role.create({ name: 'admin' }, { userId })
    perm = await Permission.create(
      {
        name: 'edit_user',
        description: 'Allows a user to edit a User',
      },
      { userId }
    )
    await role.$add(Role.RELATIONS.PERMISSIONS, perm, { userId })
    await user.$add(User.RELATIONS.ROLES, role, { userId })
  })

  test('returns 401 if userId is missing', async () => {
    const res = await request(app).get('/test')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/unauthorized/i)
  })

  test('returns 401 if user not found', async () => {
    const res = await request(app).get('/test').set('x-user-id', '99999')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/user not found/i)
  })

  test('returns 403 if user has no permissions', async () => {
    await role.$set(Role.RELATIONS.PERMISSIONS, [], { userId })
    const res = await request(app)
      .get('/test')
      .set('x-user-id', user.id.toString())
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/forbidden/i)
  })

  test('returns 200 if user has required permission', async () => {
    const res = await request(app)
      .get('/test')
      .set('x-user-id', user.id.toString())
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('OK')
  })

  test('returns 403 if user has other permissions but not required', async () => {
    await role.$set(Role.RELATIONS.PERMISSIONS, [], { userId })
    const otherPerm = await Permission.create(
      {
        name: 'get_user',
        description: 'Allows a user to get a User',
      },
      { userId }
    )
    await role.$add(Role.RELATIONS.PERMISSIONS, otherPerm, { userId })
    const res = await request(app)
      .get('/test')
      .set('x-user-id', user.id.toString())
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/forbidden/i)
  })
})
