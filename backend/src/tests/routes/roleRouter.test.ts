import express from 'express'
import request from 'supertest'

import { Permission, Role, User } from '@/models'
import mainRouter from '@/routes'

const app = express()
app.use(express.json())
app.use(mainRouter)

let user: User, role: Role, permission: Permission, permissions: Permission[]

beforeEach(async () => {
  // Insert test data
  user = await User.create(
    { username: 'Test', passwordHash: 'pass' },
    { userId: 0 }
  )
  role = await Role.create({ name: 'Test Role' }, { userId: user.id })

  // Create all necessary permissions
  permissions = await Permission.bulkCreate(
    [
      { name: 'create_role', description: 'Allows creating roles' },
      { name: 'get_role', description: 'Allows getting roles' },
      { name: 'edit_role', description: 'Allows editing roles' },
      { name: 'delete_role', description: 'Allows deleting roles' },
    ],
    { userId: user.id }
  )

  // Assign all permissions to the role
  await role.$add(Role.RELATIONS.PERMISSIONS, permissions, { userId: user.id })
  await user.$add(User.RELATIONS.ROLES, role, { userId: user.id })
})

describe('Role Routes', () => {
  it('should create a role with valid authentication and authorization', async () => {
    // Assign the specific permission to a variable for use in tests
    permission = permissions.find((p) => p.name === 'create_role')!

    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .post('/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Role',
        description: 'A new role',
        permissionIds: [permission.id], // Use the initialized permission
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('name', 'New Role')
  })

  it('should get a role by ID with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/roles/${role.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Test Role')
  })

  it('should return 404 for a non-existent role', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/roles/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Role not found')
  })

  it('should get all roles with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/roles?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should update a role with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .put(`/roles/${role.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Role',
        description: 'Updated description',
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Updated Role')
  })

  it('should throw if trying to delete a role with associated users', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/roles/${role.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Cannot delete role with assigned users.'
    )
  })

  it('should delete a role with valid authentication and authorization', async () => {
    // Create role that has no associations
    const deleteRole = await Role.create(
      { name: 'deleterole' },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/roles/${deleteRole.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get(`/roles/${role.id}`)
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
      .post('/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Role',
        description: 'Should not be created',
      })

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Forbidden')
  })
})
