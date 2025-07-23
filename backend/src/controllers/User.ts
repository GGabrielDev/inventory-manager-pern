import jwt from 'jsonwebtoken'
import { Op, OrderItem } from 'sequelize'

import { ChangeLog, Role, User } from '@/models'
import { SECRET_KEY } from '@/utils/auth-utils'

interface PaginationOptions {
  page: number
  pageSize: number
}

export const SortByOptions = ['username', 'creationDate', 'updatedOn']
export const SortOrderOptions = ['ASC', 'DESC']

export interface UserFilterOptions extends PaginationOptions {
  username?: string
  sortBy?: (typeof SortByOptions)[number]
  sortOrder?: (typeof SortOrderOptions)[number]
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
}

export class UserController {
  // Create a new user with roles
  static async createUser(
    username: User['username'],
    password: User['passwordHash'],
    userId: User['id'],
    roleIds: number[] = []
  ): Promise<User> {
    if (!username) {
      throw new Error('Validation error: Username is required')
    }
    if (!password) {
      throw new Error('Validation error: Password is required')
    }
    if (typeof userId !== 'number' || userId < 0) {
      throw new Error('Invalid userId')
    }

    const user = await User.create(
      { username, passwordHash: password },
      { userId }
    )

    if (roleIds.length > 0) {
      const roles = await Role.findAll({ where: { id: roleIds } })
      await user.$set(User.RELATIONS.ROLES, roles, { userId })
    }

    return user
  }

  // User login
  static async login(username: string, password: string): Promise<string> {
    const user = await User.unscoped().findOne({ where: { username } })

    if (!user || !(await user.validatePassword(password))) {
      throw new Error('Invalid username or password')
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: '1h',
    })

    return token
  }

  // Get a user by ID
  static async getUserById(userId: User['id']): Promise<User | null> {
    if (typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId')
    }

    const user = await User.findByPk(userId, {
      include: [
        User.RELATIONS.ROLES,
        {
          model: ChangeLog,
          as: User.RELATIONS.CHANGELOGS,
          include: [ChangeLog.RELATIONS.CHANGELOG_DETAILS],
        },
      ],
    })

    if (!user) {
      return null
    }

    // Clone user to a plain object with toJSON method
    const userData = user.toJSON()

    // Process the change logs to obfuscate passwordHash fields
    userData.changeLogs = user.changeLogs.map((changeLog) => {
      const obfuscatedDetails = changeLog.changeLogDetails.map((detail) => {
        if (detail.field === 'passwordHash') {
          return {
            ...detail.toJSON(), // Convert Sequelize instance to plain object
            oldValue: '************',
            newValue: '************',
          }
        }
        return detail.toJSON()
      })

      return {
        ...changeLog.toJSON(),
        changeLogDetails: obfuscatedDetails,
      }
    })

    return userData as User
  }

  // Get all users with pagination and optional filters and sorting
  static async getAllUsers({
    page,
    pageSize,
    username,
    sortBy,
    sortOrder = 'ASC',
  }: UserFilterOptions): Promise<PaginatedResult<User>> {
    if (page < 1 || pageSize < 1) {
      return { data: [], total: 0, totalPages: 0, currentPage: page }
    }

    const offset = (page - 1) * pageSize
    const andConditions: any[] = []

    // Filter by username (partial match)
    if (username) {
      andConditions.push({ username: { [Op.like]: `%${username}%` } })
    }

    const where = andConditions.length ? { [Op.and]: andConditions } : undefined

    let order: OrderItem[] | undefined = undefined
    if (sortBy) {
      const column =
        sortBy === 'creationDate'
          ? 'creationDate'
          : sortBy === 'updatedOn'
            ? 'updatedOn'
            : 'username'
      order = [[column, sortOrder]]
    }

    const data = await User.findAll({
      where,
      offset,
      limit: pageSize,
      order,
      include: [User.RELATIONS.ROLES],
    })

    const total = await User.count({ where })

    return {
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    }
  }

  // Update a user and their roles
  static async updateUser(
    userId: User['id'],
    updates: Partial<User>,
    actionUserId: User['id'],
    roleIds: Role['id'][] = []
  ): Promise<User | null> {
    if (typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId')
    }

    const user = await User.findByPk(userId)
    if (!user) return null

    await user.update(updates, { userId: actionUserId })

    if (roleIds.length > 0) {
      const roles = await Role.findAll({ where: { id: roleIds } })
      await user.$set(User.RELATIONS.ROLES, roles, { userId: actionUserId })
    }

    return user
  }

  // Delete a user
  static async deleteUser(
    userId: User['id'],
    actionUserId: User['id']
  ): Promise<boolean> {
    if (typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId')
    }

    const user = await User.findByPk(userId)
    if (!user) return false

    await user.destroy({ userId: actionUserId })
    return true
  }
}
