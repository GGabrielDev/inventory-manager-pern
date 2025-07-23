import express from 'express'
import request from 'supertest'

import { Permission, Role, User } from '@/models'
import mainRouter from '@/routes'

const app = express()
app.use(express.json())
app.use(mainRouter)

let user: User, role: Role, permissions: Permission[]

beforeEach(async () => {
  // Insert test data
  user = await User.create(
    { username: 'TestUser', passwordHash: 'pass' },
    { userId: 0 }
  )

  role = await Role.create({ name: 'Test Role' }, { userId: user.id })
  permissions = await Permission.bulkCreate(
    [
      { name: 'create_user', description: 'Allows creating users' },
      { name: 'get_user', description: 'Allows getting users' },
      { name: 'edit_user', description: 'Allows editing users' },
      { name: 'delete_user', description: 'Allows deleting users' },
    ],
    { userId: user.id }
  )

  await role.$add(Role.RELATIONS.PERMISSIONS, permissions, { userId: user.id })
  await user.$add(User.RELATIONS.ROLES, role, { userId: user.id })
})

describe('User Routes', () => {
  let token: string

  beforeEach(async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'TestUser', password: 'pass' })

    token = loginResponse.body.token
  })

  it('should create a user with valid authentication and authorization', async () => {
    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'NewUser',
        password: 'newpass',
        roleIds: [role.id],
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('username', 'NewUser')
  })

  it('should get a user by ID with valid authentication and authorization', async () => {
    const response = await request(app)
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('username', 'TestUser')
  })

  it('should return 404 for a non-existent user', async () => {
    const response = await request(app)
      .get('/users/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'User not found')
  })

  it('should get all users with pagination', async () => {
    const response = await request(app)
      .get('/users?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should get all changelogs for userId with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'TestUser', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/users/changelogs/${user.id}?page=1&pageSize=1`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should update a user with valid authentication and authorization', async () => {
    const response = await request(app)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'UpdatedUser',
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('username', 'UpdatedUser')
  })

  it('should delete a user with valid authentication and authorization', async () => {
    const response = await request(app)
      .delete(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get(`/users/${user.id}`)
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

    const unauthorizedToken = loginResponse.body.token

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({
        username: 'UnauthorizedUser',
        password: 'nopass',
      })

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Forbidden')
  })
})

describe('User Routes – filters', () => {
  let token: string

  beforeEach(async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'TestUser', password: 'pass' })

    token = loginResponse.body.token

    // create three users with different names
    await User.create(
      {
        username: 'Alice',
        passwordHash: 'pass',
      },
      { userId: user.id }
    )
    await User.create(
      {
        username: 'Bob',
        passwordHash: 'pass',
      },
      { userId: user.id }
    )
    await User.create(
      {
        username: 'Carol',
        passwordHash: 'pass',
      },
      { userId: user.id }
    )
  })

  it('filters by partial name match', async () => {
    const res = await request(app)
      .get('/users?username=ob') // matches "Alice"
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = res.body.data.map((u: any) => u.username)
    expect(names).toContain('Bob')
    expect(names).not.toContain('Carol')
    expect(names).not.toContain('Alice')
  })
})

describe('User Routes – sorting', () => {
  let token: string

  beforeEach(async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'TestUser', password: 'pass' })

    token = loginResponse.body.token

    // create three users with different creation dates
    await User.create(
      {
        username: 'Alice',
        passwordHash: 'pass',
        creationDate: new Date('2025-01-01'),
      },
      { userId: user.id }
    )
    await User.create(
      {
        username: 'Bob',
        passwordHash: 'pass',
        creationDate: new Date('2025-02-01'),
      },
      { userId: user.id }
    )
    await User.create(
      {
        username: 'Carol',
        passwordHash: 'pass',
        creationDate: new Date('2025-03-01'),
      },
      { userId: user.id }
    )
  })

  const getSortedUsernames = (users: any[]) =>
    users.map((u) => u.username).filter((u) => u !== 'TestUser')

  it('sorts by creation date ascending', async () => {
    const res = await request(app)
      .get('/users?sortBy=creationDate&sortOrder=ASC')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = getSortedUsernames(res.body.data)
    expect(names).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('sorts by creation date descending', async () => {
    const res = await request(app)
      .get('/users?sortBy=creationDate&sortOrder=DESC')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = getSortedUsernames(res.body.data)
    expect(names).toEqual(['Carol', 'Bob', 'Alice'])
  })

  it('sorts by username ascending', async () => {
    const res = await request(app)
      .get('/users?sortBy=username&sortOrder=ASC')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = getSortedUsernames(res.body.data)
    expect(names).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('sorts by username descending', async () => {
    const res = await request(app)
      .get('/users?sortBy=username&sortOrder=DESC')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = getSortedUsernames(res.body.data)
    expect(names).toEqual(['Carol', 'Bob', 'Alice'])
  })

  it('should ignore invalid sortBy and sortOrder', async () => {
    const res = await request(app)
      .get('/users?sortBy=invalid&sortOrder=invalid')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const names = getSortedUsernames(res.body.data)
    expect(names).toEqual(['Alice', 'Bob', 'Carol'])
  })
})
