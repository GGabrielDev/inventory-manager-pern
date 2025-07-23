import { ChangeLog, User } from '@/models'
import * as changeLogger from '@/utils/change-logger'

describe('User Model', () => {
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

  it('should create a user with valid fields', async () => {
    const user = await User.create(
      {
        username: 'testuser',
        passwordHash: 'test',
      },
      { userId: systemUser.id }
    )
    expect(user.id).toBeDefined()
    expect(user.username).toBe('testuser')
    expect(user.creationDate).toBeInstanceOf(Date)
    expect(user.updatedOn).toBeInstanceOf(Date)
    expect(user.deletionDate).toBeFalsy()
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(User),
      expect.objectContaining({
        userId: systemUser.id,
        modelName: ChangeLog.RELATIONS.USER,
        modelId: expect.any(Number),
      })
    )
  })

  it('should hash password with hook', async () => {
    const user = await User.create(
      {
        username: 'hashtest',
        passwordHash: 'plaintext',
      },
      { userId: systemUser.id }
    )
    expect(user.passwordHash).not.toBe('plaintext')
    expect(await user.validatePassword('plaintext')).toBe(true)
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(User),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should enforce unique username', async () => {
    await User.create(
      { username: 'uniqueuser', passwordHash: 'x' },
      { userId: systemUser.id }
    )
    await expect(
      User.create(
        { username: 'uniqueuser', passwordHash: 'y' },
        { userId: systemUser.id }
      )
    ).rejects.toThrow()
    expect(logHookSpy).toHaveBeenCalledWith(
      'create',
      expect.any(User),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should update password and call update log hook', async () => {
    const user = await User.create(
      { username: 'updateuser', passwordHash: 'first' },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    user.passwordHash = 'second'
    await user.save({ userId: systemUser.id })
    expect(await user.validatePassword('second')).toBe(true)
    expect(logHookSpy).toHaveBeenCalledWith(
      'update',
      expect.any(User),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should soft-delete a user and call delete log hook', async () => {
    const user = await User.create(
      { username: 'deluser', passwordHash: 'x' },
      { userId: systemUser.id }
    )
    logHookSpy.mockClear()
    await user.destroy({ userId: systemUser.id })
    expect(user.deletionDate).toBeInstanceOf(Date)
    expect(logHookSpy).toHaveBeenCalledWith(
      'delete',
      expect.any(User),
      expect.objectContaining({ userId: systemUser.id })
    )
  })

  it('should retrieve user without passwordHash by default', async () => {
    const user = await User.create(
      { username: 'nopassword', passwordHash: 'secret' },
      { userId: systemUser.id }
    )
    const foundUser = await User.findByPk(user.id)
    expect(foundUser).toBeDefined()
    expect(foundUser?.passwordHash).toBeUndefined()
  })

  it('should retrieve user with passwordHash when explicitly included', async () => {
    const user = await User.create(
      { username: 'withpassword', passwordHash: 'secret' },
      { userId: systemUser.id }
    )
    const foundUser = await User.unscoped().findByPk(user.id, {
      attributes: { include: ['passwordHash'] },
    })
    expect(foundUser).toBeDefined()
    expect(foundUser?.passwordHash).toBeDefined()
  })
})
