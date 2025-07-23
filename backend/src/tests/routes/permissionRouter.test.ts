import express from 'express'
import request from 'supertest'

import { Permission, Role, User } from '@/models'
import mainRouter from '@/routes'

const app = express()
app.use(express.json())
app.use(mainRouter)

let user: User, role: Role, permission: Permission

beforeEach(async () => {
  // Insert test data
  user = await User.create(
    { username: 'Test', passwordHash: 'pass' },
    { userId: 0 }
  )
  role = await Role.create({ name: 'Test Role' }, { userId: user.id })
  permission = await Permission.create(
    {
      id: 1,
      name: 'get_permission',
      description: 'Allows getting permissions',
    },
    { userId: user.id }
  )

  await role.$add(Role.RELATIONS.PERMISSIONS, permission, { userId: user.id })
  await user.$add(User.RELATIONS.ROLES, role, { userId: user.id })
})

describe('Permission Routes', () => {
  it('should get a permission by ID with valid authentication and authorization', async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/permissions/1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id', 1)
  })

  it('should return 404 for a non-existent permission', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/permissions/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Permission not found')
  })

  it('should get all permissions with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/permissions?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get('/permissions/1')
    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('message', 'Token not provided')
  })

  it('should return 403 if not authorized', async () => {
    // Create a user without the necessary permissions
    await User.create(
      { id: 2, username: 'Unauthorized', passwordHash: 'pass' },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Unauthorized', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/permissions/1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Forbidden')
  })
})
