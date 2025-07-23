import { ChangeLogController } from '@/controllers/ChangeLog'
import { Category, Department, Item, User } from '@/models'
import { UnitType } from '@/models/Item'

describe('ChangeLogController', () => {
  let systemUser: User
  let item: Item
  let category: Category
  let department: Department

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )

    category = await Category.create(
      { name: 'Test Category' },
      { userId: systemUser.id }
    )

    department = await Department.create(
      { name: 'Test Department' },
      { userId: systemUser.id }
    )

    item = await Item.create(
      { name: 'Test Item', departmentId: department.id, unit: UnitType.KG },
      { userId: systemUser.id }
    )

    // Update item to trigger change log creation
    await item.update({ name: 'Updated Test Item' }, { userId: systemUser.id })

    // Delete category to trigger change log creation
    await category.destroy({ userId: systemUser.id })
  })

  it('should get change logs by category ID', async () => {
    const result = await ChangeLogController.getChangeLogsByCategoryId(
      category.id,
      { page: 1, pageSize: 10 }
    )
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].categoryId).toBe(category.id)
    expect(result.data[0].changeLogDetails.length).toBeGreaterThan(0)
  })

  it('should get change logs by item ID', async () => {
    const result = await ChangeLogController.getChangeLogsByItemId(item.id, {
      page: 1,
      pageSize: 10,
    })
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].itemId).toBe(item.id)
    expect(result.data[0].changeLogDetails.length).toBeGreaterThan(0)
  })

  it('should get change logs by department ID', async () => {
    const result = await ChangeLogController.getChangeLogsByDepartmentId(
      department.id,
      { page: 1, pageSize: 10 }
    )
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].departmentId).toBe(department.id)
    expect(result.data[0].changeLogDetails.length).toBeGreaterThan(0)
  })

  it('should get change logs by user ID', async () => {
    // As the bypass user (id 0) isn't logged, we make a new user to be logged instead
    const loggedUser = await User.create(
      { username: 'Logged user', passwordHash: 'securePassword' },
      { userId: systemUser.id }
    )

    const result = await ChangeLogController.getChangeLogsByUserId(
      loggedUser.id,
      { page: 1, pageSize: 10 }
    )
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].changedBy).toBe(systemUser.id)
    expect(result.data[0].changeLogDetails.length).toBeGreaterThan(0)
  })
})

describe('CategoryController - Edge Cases and Invalid Inputs', () => {
  let systemUser: User
  let item: Item
  let category: Category
  let department: Department

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )

    category = await Category.create(
      { name: 'Test Category' },
      { userId: systemUser.id }
    )

    department = await Department.create(
      { name: 'Test Department' },
      { userId: systemUser.id }
    )

    item = await Item.create(
      { name: 'Test Item', departmentId: department.id, unit: UnitType.KG },
      { userId: systemUser.id }
    )

    // Update item to trigger change log creation
    await item.update({ name: 'Updated Test Item' }, { userId: systemUser.id })

    // Delete category to trigger change log creation
    await category.destroy({ userId: systemUser.id })
  })

  it('should handle invalid categoryId', async () => {
    await expect(
      ChangeLogController.getChangeLogsByCategoryId(NaN, {
        page: 1,
        pageSize: 10,
      })
    ).rejects.toThrow('Invalid categoryId')
  })

  it('should handle invalid itemId', async () => {
    await expect(
      ChangeLogController.getChangeLogsByItemId(NaN, { page: 1, pageSize: 10 })
    ).rejects.toThrow('Invalid itemId')
  })

  it('should handle invalid departmentId', async () => {
    await expect(
      ChangeLogController.getChangeLogsByDepartmentId(NaN, {
        page: 1,
        pageSize: 10,
      })
    ).rejects.toThrow('Invalid departmentId')
  })

  it('should handle invalid userId', async () => {
    await expect(
      ChangeLogController.getChangeLogsByUserId(NaN, { page: 1, pageSize: 10 })
    ).rejects.toThrow('Invalid userId')
  })
})
