import sequelize from '@/loaders/sequelize'
import {
  Category,
  ChangeLog,
  ChangeLogDetail,
  Department,
  Item,
  User,
} from '@/models'
import { DIFF_TYPES, OPERATION_TO_DIFF_TYPE } from '@/models/ChangeLog'

Error.stackTraceLimit = 50

describe('ChangeLogDetail Model', () => {
  let user: User
  let changeLog: ChangeLog
  let department: Department
  let item: Item

  beforeEach(async () => {
    user = await User.create(
      { username: 'TestUser', passwordHash: 'test' },
      { userId: 0 }
    )
    department = await Department.create(
      { name: 'Test Department' },
      { userId: user.id }
    )
    item = await Item.create(
      { name: 'Test Item', departmentId: department.id },
      { userId: user.id }
    )
    changeLog = await ChangeLog.create({
      operation: 'update',
      changedBy: user.id,
      itemId: item.id,
    })
  })

  test('creates with valid diffType', async () => {
    for (const diffType of DIFF_TYPES) {
      const detail = await ChangeLogDetail.create({
        changeLogId: changeLog.id,
        field: 'name',
        oldValue: 'A',
        newValue: 'B',
        diffType,
      })
      expect(detail.diffType).toBe(diffType)
    }
  })

  test('rejects invalid diffType', async () => {
    await expect(
      ChangeLogDetail.create({
        changeLogId: changeLog.id,
        field: 'name',
        diffType: 'invalid',
      })
    ).rejects.toThrow()
  })

  test('requires changeLogId and field', async () => {
    await expect(
      ChangeLogDetail.create({
        diffType: DIFF_TYPES[0],
      })
    ).rejects.toThrow()
  })

  test('associates to ChangeLog', async () => {
    const detail = await ChangeLogDetail.create({
      changeLogId: changeLog.id,
      field: 'status',
      diffType: DIFF_TYPES[0],
    })
    const parent = await detail.$get(ChangeLogDetail.RELATIONS.CHANGELOG)
    expect(parent?.id).toBe(changeLog.id)
  })
})

describe('Integration: ChangeLogDetail on Item update', () => {
  let user: User
  let department: Department
  let category: Category
  let item: Item

  beforeEach(async () => {
    user = await User.create(
      { id: 0, username: 'DetailTest', passwordHash: 'pw' },
      { userId: 0 }
    )
    department = await Department.create(
      { name: 'Detail Dept' },
      { userId: user.id }
    )
    category = await Category.create(
      { name: 'Detail Cat' },
      { userId: user.id }
    )
    item = await Item.create(
      {
        name: 'Old Name',
        quantity: 5,
        unit: 'und.',
        departmentId: department.id,
        categoryId: category.id,
      },
      { userId: user.id }
    )
  })

  it('creates ChangeLogDetails for each changed field', async () => {
    const transaction = await sequelize.transaction()

    // Update multiple fields
    await item.update(
      { name: 'New Name', quantity: 10 },
      { userId: user.id, transaction }
    )

    // Fetch the latest ChangeLog for this item and operation
    const changeLog = await ChangeLog.findOne({
      where: { itemId: item.id, operation: 'update' },
      order: [['changedAt', 'DESC']],
      transaction,
    })
    expect(changeLog).toBeTruthy()

    // Fetch ChangeLogDetails for this ChangeLog
    const details = await ChangeLogDetail.findAll({
      where: { changeLogId: changeLog!.id },
      transaction,
    })
    const fields = details.map((d) => d.field)

    // Check that both changed fields are present
    expect(fields).toContain('name')
    expect(fields).toContain('quantity')

    // Check values and diff types
    const nameDetail = details.find((d) => d.field === 'name')
    const qtyDetail = details.find((d) => d.field === 'quantity')
    expect(nameDetail?.oldValue).toBe('Old Name')
    expect(nameDetail?.newValue).toBe('New Name')
    expect(qtyDetail?.oldValue).toBe(5)
    expect(qtyDetail?.newValue).toBe(10)
    expect([nameDetail?.diffType, qtyDetail?.diffType]).toContain(
      OPERATION_TO_DIFF_TYPE.update
    )
  })
})
