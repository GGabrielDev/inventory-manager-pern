import { DepartmentController } from '@/controllers'
import { Department, Item, User } from '@/models'

describe('DepartmentController', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should create a department with valid fields', async () => {
    const department = await DepartmentController.createDepartment(
      'HR',
      systemUser.id
    )
    expect(department.id).toBeDefined()
    expect(department.name).toBe('HR')
  })

  it('should get a department by ID', async () => {
    const createdDepartment = await DepartmentController.createDepartment(
      'Finance',
      systemUser.id
    )
    const department = await DepartmentController.getDepartmentById(
      createdDepartment.id
    )
    expect(department).toBeDefined()
    expect(department?.name).toBe('Finance')
  })

  it('should get all departments with pagination', async () => {
    await DepartmentController.createDepartment('Department1', systemUser.id)
    await DepartmentController.createDepartment('Department2', systemUser.id)

    const result = await DepartmentController.getAllDepartments({
      page: 1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('should update a department', async () => {
    const department = await DepartmentController.createDepartment(
      'Tech',
      systemUser.id
    )
    const updatedDepartment = await DepartmentController.updateDepartment(
      department.id,
      { name: 'Technology' },
      systemUser.id
    )
    expect(updatedDepartment).toBeDefined()
    expect(updatedDepartment?.name).toBe('Technology')
  })

  it('should delete a department without items', async () => {
    const department = await DepartmentController.createDepartment(
      'Obsolete',
      systemUser.id
    )
    const result = await DepartmentController.deleteDepartment(
      department.id,
      systemUser.id
    )
    expect(result).toBe(true)

    const deletedDepartment = await Department.findByPk(department.id, {
      paranoid: false,
    })
    expect(deletedDepartment).not.toBeNull()
    expect(deletedDepartment?.deletionDate).not.toBeNull()
  })

  it('should not delete a department with assigned items', async () => {
    const department = await DepartmentController.createDepartment(
      'Electronics',
      systemUser.id
    )
    await Item.create(
      { name: 'Laptop', departmentId: department.id },
      { userId: systemUser.id }
    )

    await expect(
      DepartmentController.deleteDepartment(department.id, systemUser.id)
    ).rejects.toThrow('Cannot delete department with assigned items.')
  })

  it('should not find a non-existent department', async () => {
    const department = await DepartmentController.getDepartmentById(9999)
    expect(department).toBeNull()
  })

  it('should handle unique department name constraint', async () => {
    await DepartmentController.createDepartment(
      'UniqueDepartment',
      systemUser.id
    )
    await expect(
      DepartmentController.createDepartment('UniqueDepartment', systemUser.id)
    ).rejects.toThrow()
  })
})

describe('DepartmentController - Edge Cases and Invalid Inputs', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should throw an error if department name is missing when creating a department', async () => {
    await expect(
      DepartmentController.createDepartment('', systemUser.id)
    ).rejects.toThrow('Validation error')
  })

  it('should throw an error if userId is invalid when creating a department', async () => {
    await expect(
      DepartmentController.createDepartment('InvalidDepartment', -1)
    ).rejects.toThrow('Invalid userId')
  })

  it('should return null if trying to update a non-existent department', async () => {
    const result = await DepartmentController.updateDepartment(
      9999,
      { name: 'newname' },
      systemUser.id
    )
    expect(result).toBeNull()
  })

  it('should return false if trying to delete a non-existent department', async () => {
    const result = await DepartmentController.deleteDepartment(
      9999,
      systemUser.id
    )
    expect(result).toBe(false)
  })

  it('should handle invalid page number in pagination', async () => {
    const result = await DepartmentController.getAllDepartments({
      page: -1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle invalid page size in pagination', async () => {
    const result = await DepartmentController.getAllDepartments({
      page: 1,
      pageSize: -1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric departmentId in getDepartmentById', async () => {
    await expect(DepartmentController.getDepartmentById(NaN)).rejects.toThrow(
      'Invalid departmentId'
    )
  })
})
