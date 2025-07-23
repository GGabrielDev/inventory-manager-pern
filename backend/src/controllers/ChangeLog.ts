import { ChangeLog } from '@/models'

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

export class ChangeLogController {
  // Get change logs by category ID
  static async getChangeLogsByCategoryId(
    categoryId: ChangeLog['categoryId'],
    { page, pageSize }: PaginationOptions
  ): Promise<PaginatedResult<ChangeLog>> {
    if (categoryId == null || isNaN(categoryId)) {
      throw new Error('Invalid categoryId')
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await ChangeLog.findAndCountAll({
      where: { categoryId },
      offset,
      limit: pageSize,
      include: [
        ChangeLog.RELATIONS.CATEGORY,
        ChangeLog.RELATIONS.USER,
        ChangeLog.RELATIONS.CHANGELOG_DETAILS,
      ],
      distinct: true,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }

  // Get change logs by item ID
  static async getChangeLogsByItemId(
    itemId: ChangeLog['itemId'],
    { page, pageSize }: PaginationOptions
  ): Promise<PaginatedResult<ChangeLog>> {
    if (itemId == null || isNaN(itemId)) {
      throw new Error('Invalid itemId')
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await ChangeLog.findAndCountAll({
      where: { itemId },
      offset,
      limit: pageSize,
      include: [
        ChangeLog.RELATIONS.ITEM,
        ChangeLog.RELATIONS.USER,
        ChangeLog.RELATIONS.CHANGELOG_DETAILS,
      ],
      distinct: true,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }

  // Get change logs by department ID
  static async getChangeLogsByDepartmentId(
    departmentId: ChangeLog['departmentId'],
    { page, pageSize }: PaginationOptions
  ): Promise<PaginatedResult<ChangeLog>> {
    if (departmentId == null || isNaN(departmentId)) {
      throw new Error('Invalid departmentId')
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await ChangeLog.findAndCountAll({
      where: { departmentId },
      offset,
      limit: pageSize,
      include: [
        ChangeLog.RELATIONS.DEPARTMENT,
        ChangeLog.RELATIONS.USER,
        ChangeLog.RELATIONS.CHANGELOG_DETAILS,
      ],
      distinct: true,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }

  // Get change logs by user ID
  static async getChangeLogsByUserId(
    userId: ChangeLog['userId'],
    { page, pageSize }: PaginationOptions
  ): Promise<PaginatedResult<ChangeLog>> {
    if (userId == null || isNaN(userId)) {
      throw new Error('Invalid userId')
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await ChangeLog.findAndCountAll({
      where: { userId },
      offset,
      limit: pageSize,
      include: [
        ChangeLog.RELATIONS.USER,
        ChangeLog.RELATIONS.CHANGELOG_DETAILS,
      ],
      distinct: true,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }
}
