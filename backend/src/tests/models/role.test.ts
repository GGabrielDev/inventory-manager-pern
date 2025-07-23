import { ChangeLog, Role, User } from '@/models'
import * as changeLogger from '@/utils/change-logger'

describe('Role Model', () => {
  let systemUser: User
  let logHookSpy: jest.SpyInstance

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )
    logHookSpy = jest
      .spyOn(changeLogger, 'logHook')
      .mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (logHookSpy) logHookSpy.mockRestore()
  })

  it('should create a role with valid fields', async () => {
    const role = await Role.create(
      {
        name: 'admin',
        description: 'Administrator',
      },
      { userId: systemUser.id }
    )
    expect(role.id).toBeDefined()
    expect(role.name).toBe('admin')
    expect(role.creationDate).toBeInstanceOf(Date)
    expect(role.updatedOn).toBeInstanceOf(Date)
    expect(role.deletionDate).toBeFalsy()
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(Role),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: ChangeLog.RELATIONS.ROLE,
        modelId: expect.any(Number),
      })
    )
  })

  it('should enforce unique role name', async () => {
    await Role.create(
      { name: 'uniqueRole', description: 'desc' },
      { userId: systemUser.id }
    )
    await expect(
      Role.create(
        { name: 'uniqueRole', description: 'other desc' },
        { userId: systemUser.id }
      )
    ).rejects.toThrow()
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(Role),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should update role name and call update log hook', async () => {
    const role = await Role.create(
      { name: 'user', description: 'desc' },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    role.name = 'user2'
    await role.save({ userId: systemUser.id })
    expect(role.name).toBe('user2')
    expect(logHookSpy).toHaveBeenCalledWith(
      'update',
      expect.any(Role),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should throw if soft-deleting with users associated', async () => {
    const role = await Role.create(
      { name: 'todelete', description: 'desc' },
      { userId: systemUser.id }
    )
    await role.$add(Role.RELATIONS.USERS, systemUser, { userId: systemUser.id })

    await expect(role.destroy({ userId: systemUser.id })).rejects.toThrow(
      'Cannot delete role with assigned users.'
    )
  })

  it('should soft-delete a role and call delete log hook', async () => {
    const role = await Role.create(
      { name: 'todelete', description: 'desc' },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    await role.destroy({ userId: systemUser.id })
    expect(role.deletionDate).toBeInstanceOf(Date)
    expect(logHookSpy).toHaveBeenCalledWith(
      'delete',
      expect.any(Role),
      expect.objectContaining({ userId: systemUser.id })
    )
  })
})
