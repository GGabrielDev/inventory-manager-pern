import { RoleController } from '@/controllers'
import { Permission, Role, User } from '@/models'

describe('RoleController', () => {
  let systemUser: User
  let readPermission: Permission
  let writePermission: Permission

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )

    readPermission = await Permission.create(
      {
        name: 'read',
        description: 'Read Permission',
      },
      { userId: systemUser.id }
    )

    writePermission = await Permission.create(
      {
        name: 'write',
        description: 'Write Permission',
      },
      { userId: systemUser.id }
    )
  })

  it('should create a role with valid fields and permissions', async () => {
    const role = await RoleController.createRole(
      'admin',
      'Administrator',
      systemUser.id,
      [readPermission.id]
    )
    expect(role.id).toBeDefined()
    expect(role.name).toBe('admin')

    const permissions = await role.$get(Role.RELATIONS.PERMISSIONS)
    expect(permissions.length).toBe(1)
    expect(permissions[0].name).toBe('read')
  })

  it('should update a role and change permissions', async () => {
    const role = await RoleController.createRole(
      'user',
      'Regular User',
      systemUser.id,
      [readPermission.id]
    )

    const updatedRole = await RoleController.updateRole(
      role.id,
      { name: 'user2' },
      systemUser.id,
      [writePermission.id]
    )
    expect(updatedRole).toBeDefined()
    expect(updatedRole?.name).toBe('user2')

    const permissions = await updatedRole?.$get(Role.RELATIONS.PERMISSIONS)
    expect(permissions?.length).toBe(1)
    expect(permissions?.[0].name).toBe('write')
  })

  it('should get a role by ID', async () => {
    const createdRole = await RoleController.createRole(
      'getrole',
      'Get Role',
      systemUser.id
    )
    const role = await RoleController.getRoleById(createdRole.id)
    expect(role).toBeDefined()
    expect(role?.name).toBe('getrole')
  })

  it('should get all roles with pagination', async () => {
    await RoleController.createRole('role1', 'Role 1', systemUser.id)
    await RoleController.createRole('role2', 'Role 2', systemUser.id)

    const result = await RoleController.getAllRoles({ page: 1, pageSize: 1 })
    expect(result.data.length).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('should delete a role', async () => {
    const role = await RoleController.createRole(
      'deleterole',
      'Delete Role',
      systemUser.id
    )
    const result = await RoleController.deleteRole(role.id, systemUser.id)
    expect(result).toBe(true)

    const deletedRole = await Role.findByPk(role.id)
    expect(deletedRole).toBeNull()
  })

  it('should not find a non-existent role', async () => {
    const role = await RoleController.getRoleById(9999)
    expect(role).toBeNull()
  })

  it('should handle unique role name constraint', async () => {
    await RoleController.createRole('uniquerole', 'Unique Role', systemUser.id)
    await expect(
      RoleController.createRole('uniquerole', 'Another Role', systemUser.id)
    ).rejects.toThrow()
  })
})

describe('RoleController - Edge Cases and Invalid Inputs', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )
  })

  it('should throw an error if role name is missing when creating a role', async () => {
    await expect(
      RoleController.createRole('', 'No Name Role', systemUser.id)
    ).rejects.toThrow('Validation error')
  })

  it('should throw an error if userId is invalid when creating a role', async () => {
    await expect(
      RoleController.createRole('invalidrole', 'Invalid Role', -1)
    ).rejects.toThrow('Invalid userId')
  })

  it('should return null if trying to update a non-existent role', async () => {
    const result = await RoleController.updateRole(
      9999,
      { name: 'newname' },
      systemUser.id
    )
    expect(result).toBeNull()
  })

  it('should return false if trying to delete a non-existent role', async () => {
    const result = await RoleController.deleteRole(9999, systemUser.id)
    expect(result).toBe(false)
  })

  it('should handle invalid page number in pagination', async () => {
    const result = await RoleController.getAllRoles({ page: -1, pageSize: 1 })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle invalid page size in pagination', async () => {
    const result = await RoleController.getAllRoles({ page: 1, pageSize: -1 })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric roleId in getRoleById', async () => {
    await expect(RoleController.getRoleById(NaN)).rejects.toThrow(
      'Invalid roleId'
    )
  })
})
