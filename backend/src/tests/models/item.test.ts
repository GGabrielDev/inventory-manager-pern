import { Category, Department, Item, User } from '@/models'
import { UnitType } from '@/models/Item'

describe('Item model validations', () => {
  let departmentId: number
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    const dept = await Department.create(
      { name: 'Stationery' },
      { userId: systemUser.id }
    )
    departmentId = dept.id
  })

  it('should default quantity to 1 if not provided', async () => {
    const item = await Item.create(
      { name: 'Pen', departmentId },
      { userId: systemUser.id }
    )
    expect(item.quantity).toBe(1)
  })

  it('should fail if quantity is less than 1', async () => {
    expect.assertions(1)
    try {
      await Item.create(
        { name: 'Eraser', departmentId, quantity: 0 },
        { userId: systemUser.id }
      )
    } catch (error: any) {
      expect(error.name).toBe('SequelizeValidationError')
    }
  })

  it('should default unit to "und."', async () => {
    const item = await Item.create(
      { name: 'Notebook', departmentId },
      { userId: systemUser.id }
    )
    expect(item.unit).toBe(UnitType.UND)
  })

  it('should accept valid enum unit values', async () => {
    const item = await Item.create(
      {
        name: 'Paper',
        departmentId,
        unit: UnitType.KG,
      },
      { userId: systemUser.id }
    )
    expect(item.unit).toBe(UnitType.KG)
  })

  it('should fail if unit is not a valid enum', async () => {
    expect.assertions(1)
    try {
      await Item.create(
        {
          name: 'Folder',
          departmentId,
          unit: 'invalid-unit',
        },
        { userId: systemUser.id }
      )
    } catch (error: any) {
      expect(error.name).toMatch(/Sequelize.*Error/)
    }
  })

  it('should not allow duplicate item names', async () => {
    expect.assertions(1)
    await Item.create(
      { name: 'UniqueItem', departmentId },
      { userId: systemUser.id }
    )
    try {
      await Item.create(
        { name: 'UniqueItem', departmentId },
        { userId: systemUser.id }
      )
    } catch (error: any) {
      expect(error.name).toMatch(/Sequelize.*Error/)
    }
  })
})

describe('Item associations', () => {
  it('should relate item to category and department', async () => {
    const systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    const dept = await Department.create(
      { name: 'Office Supplies' },
      { userId: systemUser.id }
    )

    const cat = await Category.create(
      {
        name: 'Writing',
      },
      { userId: systemUser.id }
    )

    const item = await Item.create(
      {
        name: 'Ballpoint Pen',
        categoryId: cat.id,
        departmentId: dept.id,
      },
      { userId: systemUser.id }
    )

    const fetchedItem = await Item.findByPk(item.id, {
      include: [Category, Department],
    })

    expect(fetchedItem?.category?.name).toBe('Writing')
    expect(fetchedItem?.department?.name).toBe('Office Supplies')
  })
})
