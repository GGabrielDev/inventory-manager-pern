import { Department } from '@/models'

interface PaginationOptions {
  page: number
  pageSize: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
}

export class DepartmentController {
  // Create a new department
  static async createDepartment(
    name: Department['name'],
    userId: number
  ): Promise<Department> {
    if (!name) {
      throw new Error('Validation error: Department name is required')
    }
    if (typeof userId !== 'number' || userId < 0) {
      throw new Error('Invalid userId')
    }

    return Department.create({ name }, { userId })
  }

  // Get a department by ID
  static async getDepartmentById(
    departmentId: number
  ): Promise<Department | null> {
    if (typeof departmentId !== 'number' || isNaN(departmentId)) {
      throw new Error('Invalid departmentId')
    }

    return Department.findByPk(departmentId, {
      include: [Department.RELATIONS.ITEMS],
    })
  }

  // Get all departments with pagination
  static async getAllDepartments({
    page,
    pageSize,
  }: PaginationOptions): Promise<PaginatedResult<Department>> {
    if (page < 1 || pageSize < 1) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      }
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await Department.findAndCountAll({
      offset,
      limit: pageSize,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }

  // Update a department
  static async updateDepartment(
    departmentId: number,
    updates: Partial<Department>,
    actionUserId: number
  ): Promise<Department | null> {
    if (typeof departmentId !== 'number' || isNaN(departmentId)) {
      throw new Error('Invalid departmentId')
    }

    const department = await Department.findByPk(departmentId)
    if (!department) return null

    await department.update(updates, { userId: actionUserId })
    return department
  }

  // Delete a department
  static async deleteDepartment(
    departmentId: number,
    actionUserId: number
  ): Promise<boolean> {
    if (typeof departmentId !== 'number' || isNaN(departmentId)) {
      throw new Error('Invalid departmentId')
    }

    const department = await Department.findByPk(departmentId)
    if (!department) return false

    const itemCount = await department.$count('items')
    if (itemCount > 0) {
      throw new Error('Cannot delete department with assigned items.')
    }

    await department.destroy({ userId: actionUserId })
    return true
  }
}
