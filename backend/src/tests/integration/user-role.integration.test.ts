import { Role, User } from '@/models'
import { UserRole } from '@/models/join'
import * as changeLogger from '@/utils/change-logger'

describe('User-Role Integration', () => {
  let systemUser: { id: number }
  let logHookSpy: jest.SpyInstance

  beforeEach(async () => {
    // Simulates the bypass user
    systemUser = { id: 0 }
    logHookSpy = jest
      .spyOn(changeLogger, 'logHook')
      .mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (logHookSpy) logHookSpy.mockRestore()
  })

  it('should assign roles to a user and trigger link hook', async () => {
    const user = await User.create(
      {
        username: 'integration',
        passwordHash: 'pw',
      },
      { userId: systemUser.id }
    )
    const role1 = await Role.create(
      { name: 'role1' },
      { userId: systemUser.id }
    )
    const role2 = await Role.create(
      { name: 'role2' },
      { userId: systemUser.id }
    )

    logHookSpy.mockClear()

    await user.$add('roles', [role1, role2], { userId: systemUser.id })

    const foundUser = await User.findByPk(user.id, { include: [Role] })
    expect(foundUser?.roles.length).toBe(2)

    // Check logHook called for each link
    expect(logHookSpy).toHaveBeenCalledTimes(2)
    expect(logHookSpy).toHaveBeenCalledWith(
      'link',
      expect.any(UserRole),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'UserRole',
        modelId: user.id,
        relation: 'roleId',
        relatedId: role1.id,
      })
    )
    expect(logHookSpy).toHaveBeenCalledWith(
      'link',
      expect.any(UserRole),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'UserRole',
        modelId: user.id,
        relation: 'roleId',
        relatedId: role2.id,
      })
    )
  })

  it('should remove a role from a user and trigger unlink hook', async () => {
    const user = await User.create(
      { username: 'remover', passwordHash: 'pw' },
      { userId: systemUser.id }
    )
    const role = await Role.create(
      { name: 'toremove' },
      { userId: systemUser.id }
    )

    await user.$add(User.RELATIONS.ROLES, role, { userId: systemUser.id })
    logHookSpy.mockClear()
    await user.$remove(User.RELATIONS.ROLES, role, { userId: systemUser.id })

    const foundUser = await User.findByPk(user.id, { include: [Role] })
    expect(foundUser?.roles.length).toBe(0)

    // Check logHook called for unlink
    expect(logHookSpy).toHaveBeenCalledTimes(1)
    expect(logHookSpy).toHaveBeenCalledWith(
      'unlink',
      expect.any(UserRole),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: 'UserRole',
        modelId: user.id,
        relation: 'roleId',
        relatedId: role.id,
      })
    )
  })

  it('should access through model (UserRole) attributes', async () => {
    const user = await User.create(
      { username: 'through', passwordHash: 'pw' },
      { userId: systemUser.id }
    )
    const role = await Role.create(
      { name: 'throughrole' },
      { userId: systemUser.id }
    )
    await user.$add('roles', role, { userId: systemUser.id })
    const foundUser = await User.findByPk(user.id, { include: [Role] })
    const userRoleInstance = foundUser?.roles[0]?.UserRole
    if (!userRoleInstance) throw new Error('UserRole instance not found')
    expect(userRoleInstance).toBeInstanceOf(UserRole)
    expect(userRoleInstance.userId).toBe(user.id)
    expect(userRoleInstance.roleId).toBe(role.id)
  })

  it('should throw if userId is missing on link/unlink', async () => {
    const user = await User.create(
      { username: 'nouserid', passwordHash: 'pw' },
      { userId: systemUser.id }
    )
    const role = await Role.create(
      { name: 'nouserrole' },
      { userId: systemUser.id }
    )

    // link
    await expect(user.$add('roles', role)).rejects.toThrow(/userId required/)
    // add for unlink test
    await user.$add('roles', role, { userId: systemUser.id })
    // unlink
    await expect(user.$remove('roles', role)).rejects.toThrow(/userId required/)
  })

  it('should not throw when unlinking a non-linked role', async () => {
    const user = await User.create(
      { username: 'nolink', passwordHash: 'pw' },
      { userId: systemUser.id }
    )
    const role = await Role.create(
      { name: 'notlinked' },
      { userId: systemUser.id }
    )
    // Should not throw (adjust if your design expects otherwise)
    await expect(
      user.$remove('roles', role, { userId: systemUser.id })
    ).resolves.not.toThrow()
  })
})
