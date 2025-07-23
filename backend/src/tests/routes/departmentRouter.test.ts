import express from 'express'
import request from 'supertest'

import { Department, Item, Permission, Role, User } from '@/models'
import mainRouter from '@/routes'

const app = express()
app.use(express.json())
app.use(mainRouter)

let user: User, role: Role, department: Department, permissions: Permission[]

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
      { name: 'create_department', description: 'Allows creating departments' },
      { name: 'get_department', description: 'Allows getting departments' },
      { name: 'edit_department', description: 'Allows editing departments' },
      { name: 'delete_department', description: 'Allows deleting departments' },
    ],
    { userId: user.id }
  )

  // Assign all permissions to the role
  await role.$add(Role.RELATIONS.PERMISSIONS, permissions, { userId: user.id })
  await user.$add(User.RELATIONS.ROLES, role, { userId: user.id })

  // Create main department
  department = await Department.create(
    { name: 'Test Department' },
    { userId: user.id }
  )
})

describe('Department Routes', () => {
  it('should create a department with valid authentication and authorization', async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .post('/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Department',
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('name', 'New Department')
  })

  it('should get a department by ID with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/departments/${department.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Test Department')
  })

  it('should return 404 for a non-existent department', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/departments/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Department not found')
  })

  it('should get all departments with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/departments?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should get all changelogs for departmentId with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/departments/changelogs/${department.id}?page=1&pageSize=1`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should update a department with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .put(`/departments/${department.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Department',
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Updated Department')
  })

  it('should throw if trying to delete a department with associated items', async () => {
    await Item.create(
      {
        name: 'Test Item',
        departmentId: department.id,
      },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/departments/${department.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Cannot delete department with assigned items.'
    )
  })

  it('should delete a department with valid authentication and authorization', async () => {
    // Create department that has no associations
    const deleteDepartment = await Department.create(
      { name: 'deletedepartment' },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/departments/${deleteDepartment.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get(`/departments/${department.id}`)
    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('message', 'Token not provided')
  })

  it('should return 403 if not authorized', async () => {
    // Create a user without the necessary permissions
    await User.create(
      { username: 'Unauthorized', passwordHash: 'pass' },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Unauthorized', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .post('/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Department',
      })

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Forbidden')
  })
})
