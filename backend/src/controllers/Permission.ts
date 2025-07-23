import { Permission } from '@/models'

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

export class PermissionController {
  // Get a permission by ID
  static async getPermissionById(
    permissionId: number
  ): Promise<Permission | null> {
    if (typeof permissionId !== 'number' || isNaN(permissionId)) {
      throw new Error('Invalid permissionId')
    }

    return Permission.findByPk(permissionId, {
      include: [Permission.RELATIONS.CHANGELOGS],
    })
  }

  // Get all permissions with pagination
  static async getAllPermissions({
    page,
    pageSize,
  }: PaginationOptions): Promise<PaginatedResult<Permission>> {
    if (page < 1 || pageSize < 1) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      }
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await Permission.findAndCountAll({
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
}
