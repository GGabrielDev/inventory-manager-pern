import { describe, expect, it } from '@jest/globals'

import { Department, Item, User } from '@/models'

describe('Department model', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should create a department with valid name', async () => {
    const department = await Department.create(
      { name: 'HR' },
      { userId: systemUser.id }
    )
    expect(department).toBeDefined()
    expect(department.name).toBe('HR')
  })

  it('should fail if name is missing', async () => {
    expect.assertions(1)
    try {
      await Department.create({}, { userId: systemUser.id })
    } catch (err: any) {
      expect(err.name).toMatch(/Sequelize.*Error/)
    }
  })

  it('should not allow duplicate department names', async () => {
    expect.assertions(1)
    await Department.create({ name: 'Finance' }, { userId: systemUser.id })
    try {
      await Department.create({ name: 'Finance' }, { userId: systemUser.id })
    } catch (err: any) {
      expect(err.name).toMatch(/Sequelize.*Error/)
    }
  })
})

describe('Department deletion constraints', () => {
  let systemUser: User
  let department: Department

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
    department = await Department.create(
      { name: 'Tech' },
      { userId: systemUser.id }
    )
  })

  it('should not delete department with assigned items', async () => {
    await Item.create(
      { name: 'Laptop', departmentId: department.id },
      { userId: systemUser.id }
    )

    await expect(department.destroy({ userId: systemUser.id })).rejects.toThrow(
      'Cannot delete department with assigned items.'
    )
  })

  it('should soft-delete department without assigned items', async () => {
    await department.destroy({ userId: systemUser.id })

    const foundDepartment = await Department.findByPk(department.id, {
      paranoid: false,
    })
    expect(foundDepartment).not.toBeNull()
    expect(foundDepartment?.deletionDate).not.toBeNull()
  })
})

describe('Department associations', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should fail if department is not provided during creation', async () => {
    expect.assertions(1)
    try {
      await Item.create({ name: 'Unassigned Item' }, { userId: systemUser.id })
    } catch (error: any) {
      expect(error.name).toMatch(/Sequelize.*Error/)
    }
  })

  it('should allow reassociating to a different department', async () => {
    const dept1 = await Department.create(
      { name: 'Warehouse' },
      { userId: systemUser.id }
    )
    const dept2 = await Department.create(
      { name: 'Admin' },
      { userId: systemUser.id }
    )

    let item = await Item.create(
      {
        name: 'Laptop',
        quantity: 2,
        departmentId: dept1.id,
      },
      { userId: systemUser.id }
    )
    let fetched = await Item.findByPk(item.id, { include: Department })
    expect(fetched?.department?.name).toBe('Warehouse')

    await item.$set(Item.RELATIONS.DEPARTMENT, dept2, { userId: systemUser.id })
    fetched = await Item.findByPk(item.id, { include: Department })
    expect(fetched?.department?.name).toBe('Admin')
  })
})
