import express from 'express'
import request from 'supertest'

import { Category, Department, Item, Permission, Role, User } from '@/models'
import mainRouter from '@/routes'

const app = express()
app.use(express.json())
app.use(mainRouter)

let user: User, role: Role, category: Category, permissions: Permission[]

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
      { name: 'create_category', description: 'Allows creating categories' },
      { name: 'get_category', description: 'Allows getting categories' },
      { name: 'edit_category', description: 'Allows editing categories' },
      { name: 'delete_category', description: 'Allows deleting categories' },
    ],
    { userId: user.id }
  )

  // Assign all permissions to the role
  await role.$add(Role.RELATIONS.PERMISSIONS, permissions, { userId: user.id })
  await user.$add(User.RELATIONS.ROLES, role, { userId: user.id })

  // Create main category
  category = await Category.create(
    { name: 'Test Category' },
    { userId: user.id }
  )
})

describe('Category Routes', () => {
  it('should create a category with valid authentication and authorization', async () => {
    // Simulate login to get a token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Category',
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('name', 'New Category')
  })

  it('should get a category by ID with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Test Category')
  })

  it('should return 404 for a non-existent category', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/categories/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Category not found')
  })

  it('should get all categories with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get('/categories?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should get all changelogs for categoryId with pagination', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .get(`/categories/changelogs/${category.id}?page=1&pageSize=1`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.length).toBeGreaterThanOrEqual(0)
  })

  it('should update a category with valid authentication and authorization', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Category',
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('name', 'Updated Category')
  })

  it('should throw if trying to delete a category with associated items', async () => {
    // Create an item and associate it to our category to test
    const dept = await Department.create(
      { name: 'Test Department' },
      { userId: user.id }
    )
    await Item.create(
      {
        name: 'Test Item',
        categoryId: category.id,
        departmentId: dept.id,
      },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Cannot delete category with assigned items.'
    )
  })

  it('should delete a category with valid authentication and authorization', async () => {
    // Create category that has no associations
    const deleteCategory = await Category.create(
      { name: 'deletecategory' },
      { userId: user.id }
    )

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'Test', password: 'pass' })

    const token = loginResponse.body.token

    const response = await request(app)
      .delete(`/categories/${deleteCategory.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get(`/categories/${category.id}`)
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
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Category',
        description: 'Should not be created',
      })

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Forbidden')
  })
})
