import express from 'express'
import request from 'supertest'

import { UserController } from '@/controllers'
import authRouter from '@/routes/auth'

const app = express()
app.use(express.json())
app.use('/auth', authRouter)

jest.mock('@/controllers')

describe('Auth Router', () => {
  const mockLogin = UserController.login as jest.Mock

  beforeEach(() => {
    mockLogin.mockReset()
  })

  test('should return 200 and token for valid credentials', async () => {
    const token = 'valid.jwt.token'
    mockLogin.mockResolvedValue(token)

    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' })

    expect(response.status).toBe(200)
    expect(response.body.token).toBe(token)
  })

  test('should return 401 for invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid username or password'))

    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Invalid username or password')
  })

  test('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ password: 'testpass' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/username is required/i)
  })

  test('should return 400 if password is missing', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/password is required/i)
  })
})
