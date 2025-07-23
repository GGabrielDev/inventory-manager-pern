import { Category, ChangeLog, Department, Item, User } from '@/models'
import * as changeLogger from '@/utils/change-logger'

describe('Category model', () => {
  let departmentId: number
  let systemUser: User
  let logHookSpy: jest.SpyInstance

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    const dept = await Department.create(
      { name: 'Tech' },
      { userId: systemUser.id }
    )
    departmentId = dept.id
    logHookSpy = jest
      .spyOn(changeLogger, 'logHook')
      .mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (logHookSpy) logHookSpy.mockRestore()
  })

  it('should create category with valid name and call create log hook', async () => {
    const category = await Category.create(
      { name: 'Hardware', departmentId },
      { userId: systemUser.id }
    )
    expect(category).toBeDefined()
    expect(category.name).toBe('Hardware')
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(Category),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: ChangeLog.RELATIONS.CATEGORY,
        modelId: category.id,
      })
    )
  })

  it('should fail if name is missing', async () => {
    expect.assertions(1)
    try {
      await Category.create({ departmentId }, { userId: systemUser.id })
    } catch (err: any) {
      expect(err.name).toMatch(/Sequelize.*Error/)
    }
  })

  it('should not allow duplicate category names', async () => {
    expect.assertions(1)
    await Category.create({ name: 'Tools' }, { userId: systemUser.id })
    try {
      await Category.create({ name: 'Tools' }, { userId: systemUser.id })
    } catch (err: any) {
      expect(err.name).toMatch(/Sequelize.*Error/)
    }
  })

  it('should update category and call update log hook', async () => {
    const category = await Category.create(
      { name: 'Hardware', departmentId },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    category.name = 'Peripherals'
    await category.save({ userId: systemUser.id })
    expect(category.name).toBe('Peripherals')
    expect(logHookSpy).toHaveBeenCalledWith(
      'update',
      expect.any(Category),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: ChangeLog.RELATIONS.CATEGORY,
        modelId: category.id,
      })
    )
  })

  it('should soft-delete category and call delete log hook', async () => {
    const category = await Category.create(
      { name: 'Obsolete', departmentId },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    await category.destroy({ userId: systemUser.id })
    expect(category.deletionDate).toBeInstanceOf(Date)
    expect(logHookSpy).toHaveBeenCalledWith(
      'delete',
      expect.any(Category),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: ChangeLog.RELATIONS.CATEGORY,
        modelId: category.id,
      })
    )
  })
})

describe('Category deletion constraints', () => {
  let systemUser: User
  let category: Category

  beforeEach(async () => {
    systemUser = await User.create(
      { id: 0, username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    category = await Category.create(
      { name: 'Hardware' },
      { userId: systemUser.id }
    )
  })

  it('should not delete category with assigned items', async () => {
    const dept = await Department.create(
      { name: 'test' },
      { userId: systemUser.id }
    )
    await Item.create(
      { name: 'Laptop', categoryId: category.id, departmentId: dept.id },
      { userId: systemUser.id }
    )

    await expect(category.destroy({ userId: systemUser.id })).rejects.toThrow(
      'Cannot delete category with assigned items.'
    )
  })

  it('should soft-delete category without assigned items', async () => {
    await category.destroy({ userId: systemUser.id })

    const foundCategory = await Category.findByPk(category.id, {
      paranoid: false,
    })
    expect(foundCategory).not.toBeNull()
    expect(foundCategory?.deletionDate).not.toBeNull()
  })
})

describe('Category associations', () => {
  let item: Item
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { id: 0, username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    const dept = await Department.create(
      { name: 'Tech' },
      { userId: systemUser.id }
    )
    item = await Item.create(
      {
        name: 'Laptop',
        quantity: 2,
        departmentId: dept.id,
      },
      { userId: systemUser.id }
    )
  })

  it('should allow associating a category after item creation', async () => {
    const category = await Category.create(
      { name: 'Electronics' },
      { userId: systemUser.id }
    )
    await item.$set(Item.RELATIONS.CATEGORY, category, {
      userId: systemUser.id,
    })
    const fetched = await Item.findByPk(item.id, { include: Category })
    expect(fetched?.category?.name).toBe('Electronics')
  })
})
