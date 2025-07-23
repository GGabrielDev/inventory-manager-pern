import { Permission, Role } from '@/models'
import { RolePermission } from '@/models/join'
import * as changeLogger from '@/utils/change-logger'

describe('Role-Permission Integration', () => {
  let systemUser: { id: number }
  let logHookSpy: jest.SpyInstance

  beforeEach(async () => {
    systemUser = { id: 0 }
    logHookSpy = jest
      .spyOn(changeLogger, 'logHook')
      .mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (logHookSpy) logHookSpy.mockRestore()
  })

  it('should assign permissions to a role and trigger link hook', async () => {
    const role = await Role.create({ name: 'role1' }, { userId: systemUser.id })
    const permission1 = await Permission.create(
      { name: 'perm1', description: 'Permission 1' },
      { userId: systemUser.id }
    )
    const permission2 = await Permission.create(
      { name: 'perm2', description: 'Permission 2' },
      { userId: systemUser.id }
    )

    logHookSpy.mockClear()

    await role.$add('permissions', [permission1, permission2], {
      userId: systemUser.id,
    })

    const foundRole = await Role.findByPk(role.id, { include: [Permission] })
    expect(foundRole?.permissions.length).toBe(2)

    expect(logHookSpy).toHaveBeenCalledTimes(2)
    expect(logHookSpy).toHaveBeenCalledWith(
      'link',
      expect.any(RolePermission),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'RolePermission',
        modelId: role.id,
        relation: 'permissionId',
        relatedId: permission1.id,
      })
    )
    expect(logHookSpy).toHaveBeenCalledWith(
      'link',
      expect.any(RolePermission),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'RolePermission',
        modelId: role.id,
        relation: 'permissionId',
        relatedId: permission2.id,
      })
    )
  })

  it('should remove a permission from a role and trigger unlink hook', async () => {
    const role = await Role.create({ name: 'role2' }, { userId: systemUser.id })
    const permission = await Permission.create(
      { name: 'perm3', description: 'Permission 3' },
      { userId: systemUser.id }
    )

    await role.$add('permissions', permission, { userId: systemUser.id })
    logHookSpy.mockClear()
    await role.$remove('permissions', permission, { userId: systemUser.id })

    const foundRole = await Role.findByPk(role.id, { include: [Permission] })
    expect(foundRole?.permissions.length).toBe(0)

    expect(logHookSpy).toHaveBeenCalledTimes(1)
    expect(logHookSpy).toHaveBeenCalledWith(
      'unlink',
      expect.any(RolePermission),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'RolePermission',
        modelId: role.id,
        relation: 'permissionId',
        relatedId: permission.id,
      })
    )
  })
})
