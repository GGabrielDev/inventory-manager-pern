import { Category, ChangeLog, Department, Item, User } from '@/models'

describe('ChangeLog Model', () => {
  let systemUser: User
  let item: Item
  let category: Category
  let department: Department

  beforeEach(async () => {
    // Simulates the bypass user
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
      { name: 'Test Item', departmentId: department.id },
      { userId: systemUser.id }
    )
  })

  test('creates with only itemId', async () => {
    const log = await ChangeLog.create({
      itemId: item.id,
      operation: 'update',
      changedBy: systemUser.id,
      changeDetails: { field: 'name', old: 'A', new: 'B' },
      userId: systemUser.id,
    })
    expect(log.itemId).toBe(item.id)
    expect(log.categoryId).toBeFalsy()
    expect(log.departmentId).toBeFalsy()
  })

  test('creates with only categoryId', async () => {
    const log = await ChangeLog.create({
      categoryId: category.id,
      operation: 'delete',
      changedBy: systemUser.id,
      userId: systemUser.id,
    })
    expect(log.categoryId).toBe(category.id)
    expect(log.itemId).toBeFalsy()
    expect(log.departmentId).toBeFalsy()
  })

  test('creates with only departmentId', async () => {
    const log = await ChangeLog.create({
      departmentId: department.id,
      operation: 'create',
      changedBy: systemUser.id,
      userId: systemUser.id,
    })
    expect(log.departmentId).toBe(department.id)
    expect(log.itemId).toBeFalsy()
    expect(log.categoryId).toBeFalsy()
  })

  test('creates with multiple associations', async () => {
    const log = await ChangeLog.create({
      itemId: item.id,
      categoryId: category.id,
      operation: 'link',
      changedBy: systemUser.id,
      userId: systemUser.id,
    })
    expect(log.itemId).toBe(item.id)
    expect(log.categoryId).toBe(category.id)
    expect(log.departmentId).toBeFalsy()
  })

  test('fails if all associations are null', async () => {
    await expect(
      ChangeLog.create({
        operation: 'create',
        changedBy: systemUser.id,
      })
    ).rejects.toThrow(/at least one/i)
  })

  test('fails if operation is missing', async () => {
    await expect(
      ChangeLog.create({
        itemId: item.id,
        changedBy: systemUser.id,
        userId: systemUser.id,
      })
    ).rejects.toThrow()
  })

  test('fails if changedBy is missing', async () => {
    await expect(
      ChangeLog.create({
        itemId: item.id,
        operation: 'update',
        userId: systemUser.id,
      })
    ).rejects.toThrow()
  })

  test('fails for invalid operation', async () => {
    await expect(
      ChangeLog.create({
        itemId: item.id,
        operation: 'invalidop',
        changedBy: systemUser.id,
        userId: systemUser.id,
      })
    ).rejects.toThrow(/operation/i)
  })

  test('associations work', async () => {
    const log = await ChangeLog.create({
      itemId: item.id,
      categoryId: category.id,
      departmentId: department.id,
      operation: 'update',
      changedBy: systemUser.id,
      userId: systemUser.id,
    })
    const fetchedLog = await ChangeLog.findByPk(log.id, {
      include: [Item, Category, Department, User],
    })
    expect(fetchedLog?.item?.id).toBe(item.id)
    expect(fetchedLog?.category?.id).toBe(category.id)
    expect(fetchedLog?.department?.id).toBe(department.id)
    expect(fetchedLog?.user?.id).toBe(systemUser.id)
  })

  test('accepts arbitrary JSON in changeDetails', async () => {
    const details = { foo: 'bar', nested: { baz: 42 } }
    const log = await ChangeLog.create({
      itemId: item.id,
      operation: 'update',
      changedBy: systemUser.id,
      changeDetails: details,
      userId: systemUser.id,
    })
    expect(log.changeDetails).toMatchObject(details)
  })
})
