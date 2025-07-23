import { PermissionController } from '@/controllers'
import { Permission, User } from '@/models'

describe('PermissionController', () => {
  let systemUser: User
  let readPermission: Permission

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

    // Permission created for test purposes
    await Permission.create(
      {
        name: 'write',
        description: 'Write Permission',
      },
      { userId: systemUser.id }
    )
  })

  it('should get a permission by ID', async () => {
    const permission = await PermissionController.getPermissionById(
      readPermission.id
    )
    expect(permission).toBeDefined()
    expect(permission?.name).toBe('read')
  })

  it('should get all permissions with pagination', async () => {
    const result = await PermissionController.getAllPermissions({
      page: 1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('should not find a non-existent permission', async () => {
    const permission = await PermissionController.getPermissionById(9999)
    expect(permission).toBeNull()
  })
})

describe('PermissionController - Edge Cases and Invalid Inputs', () => {
  it('should handle invalid page number in pagination', async () => {
    const result = await PermissionController.getAllPermissions({
      page: -1,
      pageSize: 1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle invalid page size in pagination', async () => {
    const result = await PermissionController.getAllPermissions({
      page: 1,
      pageSize: -1,
    })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric permissionId in getPermissionById', async () => {
    await expect(PermissionController.getPermissionById(NaN)).rejects.toThrow(
      'Invalid permissionId'
    )
  })
})
