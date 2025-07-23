import { Op } from 'sequelize'

import { Category, ChangeLog, Department, Item, User } from '@/models'

describe('Integration: Items & ChangeLogging Workflow', () => {
  let systemUser: User
  let department: Department
  let category: Category
  let items: Item[] = []

  beforeEach(async () => {
    systemUser = await User.create(
      { id: 0, username: 'test_user', passwordHash: 'pw' },
      { userId: 0 }
    )
    department = await Department.create(
      { name: 'Integration Dept' },
      { userId: systemUser.id }
    )
    category = await Category.create(
      { name: 'Integration Cat' },
      { userId: systemUser.id }
    )
  })

  it('should create, update, delete items and record changelogs', async () => {
    // CREATE
    items = await Promise.all(
      [1, 2, 3].map((i) =>
        Item.create(
          {
            name: `Item${i}`,
            quantity: i * 10,
            unit: 'und.',
            categoryId: category.id,
            departmentId: department.id,
            creationDate: new Date(),
            updatedOn: new Date(),
          },
          { userId: systemUser.id }
        )
      )
    )
    // Simulate changelog entries for create (if not automatic)
    // for (const item of items) {
    //   await ChangeLog.create({
    //     operation: 'create',
    //     changedBy: systemUser.id,
    //     itemId: item.id,
    //     categoryId: category.id,
    //     departmentId: department.id,
    //     changedAt: new Date(),
    //     updatedAt: new Date(),
    //     changeDetails: { createdFields: Object.keys(item.toJSON()) },
    //   })
    // }

    const itemsInDb = await Item.findAll()
    expect(itemsInDb.length).toBe(3)

    let logs = await ChangeLog.findAll({
      where: { operation: 'create', itemId: { [Op.ne]: null } },
    })
    expect(logs.length).toBe(3)

    // UPDATE
    await Promise.all(
      items.map((item) =>
        item.update(
          { quantity: item.quantity + 5, updatedOn: new Date() },
          { userId: systemUser.id }
        )
      )
    )

    // for (const item of items) {
    //   await ChangeLog.create({
    //     operation: 'update',
    //     changedBy: systemUser.id,
    //     itemId: item.id,
    //     categoryId: category.id,
    //     departmentId: department.id,
    //     changedAt: new Date(),
    //     updatedAt: new Date(),
    //     changeDetails: { updatedFields: { quantity: item.quantity } },
    //   })
    // }

    logs = await ChangeLog.findAll({ where: { operation: 'update' } })
    expect(logs.length).toBe(3)

    // DELETE
    await Promise.all(
      items.map((item) => item.destroy({ userId: systemUser.id }))
    )

    // for (const item of items) {
    //   await ChangeLog.create({
    //     operation: 'delete',
    //     changedBy: systemUser.id,
    //     itemId: item.id,
    //     categoryId: category.id,
    //     departmentId: department.id,
    //     changedAt: new Date(),
    //     updatedAt: new Date(),
    //     changeDetails: { deleted: true },
    //   })
    // }

    const itemsAfterDelete = await Item.findAll()
    expect(itemsAfterDelete.length).toBe(0)

    logs = await ChangeLog.findAll({ where: { operation: 'delete' } })
    expect(logs.length).toBe(3)

    // VALIDATE CHANGELOG DETAILS IF NEEDED
    // Example: Check all changelogs are associated to the right user and item
    const allLogs = await ChangeLog.findAll({
      where: { itemId: { [Op.ne]: null } },
    })
    for (const log of allLogs) {
      expect(log.changedBy).toBe(systemUser.id)
      expect(items.map((i) => i.id)).toContain(log.itemId)
    }
  })
})
