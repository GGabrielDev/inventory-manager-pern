import { User } from '@/models'
import * as changeLogger from '@/utils/change-logger'
import { logEntityAction } from '@/utils/entity-hooks'

describe('logEntityAction', () => {
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

  it('should call logHook with correct parameters for create action', async () => {
    const instance = await User.create(
      {
        username: 'testUser',
        passwordHash: 'password',
      },
      { userId: systemUser.id }
    )

    await logEntityAction(
      'create',
      instance,
      { userId: systemUser.id, transaction: {} },
      'User'
    )

    expect(logHookSpy).toHaveBeenCalledWith('create', instance, {
      userId: systemUser.id,
      modelName: 'User',
      modelId: instance.id,
      transaction: {},
    })
  })

  it('should call logHook with correct parameters for update action', async () => {
    const instance = await User.create(
      {
        username: 'testUser',
        passwordHash: 'password',
      },
      { userId: systemUser.id }
    )

    instance.username = 'updatedUser'
    await instance.save({ userId: systemUser.id })

    await logEntityAction(
      'update',
      instance,
      { userId: systemUser.id, transaction: {} },
      'User'
    )

    expect(logHookSpy).toHaveBeenCalledWith('update', instance, {
      userId: systemUser.id,
      modelName: 'User',
      modelId: instance.id,
      transaction: {},
    })
  })

  it('should call logHook with correct parameters for delete action', async () => {
    const instance = await User.create(
      {
        username: 'testUser',
        passwordHash: 'password',
      },
      { userId: systemUser.id }
    )

    await instance.destroy({ userId: systemUser.id })

    await logEntityAction(
      'delete',
      instance,
      { userId: systemUser.id, transaction: {} },
      'User'
    )

    expect(logHookSpy).toHaveBeenCalledWith('delete', instance, {
      userId: systemUser.id,
      modelName: 'User',
      modelId: instance.id,
      transaction: {},
    })
  })

  it('should throw an error if userId is not a number', async () => {
    const instance = await User.create(
      {
        username: 'testUser',
        passwordHash: 'password',
      },
      { userId: systemUser.id }
    )

    await expect(
      logEntityAction(
        'create',
        instance,
        { userId: null, transaction: {} } as any,
        'User'
      )
    ).rejects.toThrow('userId required for changelog')
  })
})
