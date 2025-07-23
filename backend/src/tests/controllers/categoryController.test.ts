import { CategoryController } from '@/controllers'
import { Category, Department, Item, User } from '@/models'

describe('CategoryController', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should create a category with valid fields', async () => {
    const category = await CategoryController.createCategory(
      'Hardware',
      systemUser.id
    )
    expect(category.id).toBeDefined()
    expect(category.name).toBe('Hardware')
  })

  it('should get a category by ID', async () => {
    const createdCategory = await CategoryController.createCategory(
      'Software',
      systemUser.id
    )
    const category = await CategoryController.getCategoryById(
      createdCategory.id
    )
    expect(category).toBeDefined()
    expect(category?.name).toBe('Software')
  })

  it('should get all categories with pagination', async () => {
    await CategoryController.createCategory('Category1', systemUser.id)
    await CategoryController.createCategory('Category2', systemUser.id)

    const result = await CategoryController.getAllCategories({
      page: 1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('should update a category', async () => {
    const category = await CategoryController.createCategory(
      'Gadgets',
      systemUser.id
    )
    const updatedCategory = await CategoryController.updateCategory(
      category.id,
      { name: 'Devices' },
      systemUser.id
    )
    expect(updatedCategory).toBeDefined()
    expect(updatedCategory?.name).toBe('Devices')
  })

  it('should delete a category without items', async () => {
    const category = await CategoryController.createCategory(
      'Obsolete',
      systemUser.id
    )
    const result = await CategoryController.deleteCategory(
      category.id,
      systemUser.id
    )
    expect(result).toBe(true)

    const deletedCategory = await Category.findByPk(category.id, {
      paranoid: false,
    })
    expect(deletedCategory).not.toBeNull()
    expect(deletedCategory?.deletionDate).not.toBeNull()
  })

  it('should not delete a category with assigned items', async () => {
    const department = await Department.create(
      { name: 'Storage' },
      { userId: systemUser.id }
    )
    const category = await CategoryController.createCategory(
      'Electronics',
      systemUser.id
    )
    await Item.create(
      { name: 'Laptop', categoryId: category.id, departmentId: department.id },
      { userId: systemUser.id }
    )

    await expect(
      CategoryController.deleteCategory(category.id, systemUser.id)
    ).rejects.toThrow('Cannot delete category with assigned items.')
  })

  it('should not find a non-existent category', async () => {
    const category = await CategoryController.getCategoryById(9999)
    expect(category).toBeNull()
  })

  it('should handle unique category name constraint', async () => {
    await CategoryController.createCategory('UniqueCategory', systemUser.id)
    await expect(
      CategoryController.createCategory('UniqueCategory', systemUser.id)
    ).rejects.toThrow()
  })
})

describe('CategoryController - Edge Cases and Invalid Inputs', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should throw an error if category name is missing when creating a category', async () => {
    await expect(
      CategoryController.createCategory('', systemUser.id)
    ).rejects.toThrow('Validation error')
  })

  it('should throw an error if userId is invalid when creating a category', async () => {
    await expect(
      CategoryController.createCategory('InvalidCategory', -1)
    ).rejects.toThrow('Invalid userId')
  })

  it('should return null if trying to update a non-existent category', async () => {
    const result = await CategoryController.updateCategory(
      9999,
      { name: 'newname' },
      systemUser.id
    )
    expect(result).toBeNull()
  })

  it('should return false if trying to delete a non-existent category', async () => {
    const result = await CategoryController.deleteCategory(9999, systemUser.id)
    expect(result).toBe(false)
  })

  it('should handle invalid page number in pagination', async () => {
    const result = await CategoryController.getAllCategories({
      page: -1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle invalid page size in pagination', async () => {
    const result = await CategoryController.getAllCategories({
      page: 1,
      pageSize: -1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric categoryId in getCategoryById', async () => {
    await expect(CategoryController.getCategoryById(NaN)).rejects.toThrow(
      'Invalid categoryId'
    )
  })
})
