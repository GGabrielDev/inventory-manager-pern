import express, { Request, Response } from 'express'
import request from 'supertest'

import { authenticateToken } from '@/middlewares/authentication'
import { generateToken } from '@/utils/auth-utils'

const app = express()
app.use(express.json())

app.get('/protected', authenticateToken, (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: 'Access granted', userId: (req as any).userId })
})

describe('Auth Middleware', () => {
  const userId = 123
  const token = generateToken(userId)

  test('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/protected')
    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Token not provided')
  })

  test('should return 403 if token is invalid', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Invalid token')
  })

  test('should allow access and attach userId if token is valid', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Access granted')
    expect(response.body.userId).toBe(userId)
  })
})
