import { ChangeLog, Permission, Role, User } from '@/models'

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

export class RoleController {
  // Create a new role with permissions
  static async createRole(
    name: Role['name'],
    description: Role['description'],
    userId: User['id'],
    permissionIds: Permission['id'][] = []
  ): Promise<Role> {
    if (!name) {
      throw new Error('Validation error: Role name is required')
    }
    if (typeof userId !== 'number' || userId < 0) {
      throw new Error('Invalid userId')
    }

    const role = await Role.create({ name, description }, { userId })

    if (permissionIds.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permissionIds },
      })
      await role.$set(Role.RELATIONS.PERMISSIONS, permissions, { userId })
    }

    return role
  }

  // Get a role by ID
  static async getRoleById(roleId: Role['id']): Promise<Role | null> {
    if (typeof roleId !== 'number' || isNaN(roleId)) {
      throw new Error('Invalid roleId')
    }

    return Role.findByPk(roleId, {
      include: [
        Role.RELATIONS.PERMISSIONS,
        {
          model: ChangeLog,
          as: Role.RELATIONS.CHANGELOGS,
          include: [ChangeLog.RELATIONS.CHANGELOG_DETAILS],
        },
      ],
    })
  }

  // Get all roles with pagination
  static async getAllRoles({
    page,
    pageSize,
  }: PaginationOptions): Promise<PaginatedResult<Role>> {
    if (page < 1 || pageSize < 1) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      }
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await Role.findAndCountAll({
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

  // Update a role and its permissions
  static async updateRole(
    roleId: Role['id'],
    updates: Partial<Role>,
    actionUserId: User['id'],
    permissionIds: Permission['id'][] = []
  ): Promise<Role | null> {
    if (typeof roleId !== 'number' || isNaN(roleId)) {
      throw new Error('Invalid roleId')
    }

    const role = await Role.findByPk(roleId)
    if (!role) return null

    await role.update(updates, { userId: actionUserId })

    if (permissionIds.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permissionIds },
      })
      await role.$set(Role.RELATIONS.PERMISSIONS, permissions, {
        userId: actionUserId,
      })
    }

    return role
  }

  // Delete a role
  static async deleteRole(
    roleId: Role['id'],
    actionUserId: User['id']
  ): Promise<boolean> {
    if (typeof roleId !== 'number' || isNaN(roleId)) {
      throw new Error('Invalid roleId')
    }

    const role = await Role.findByPk(roleId)
    if (!role) return false

    await role.destroy({ userId: actionUserId })
    return true
  }
}
