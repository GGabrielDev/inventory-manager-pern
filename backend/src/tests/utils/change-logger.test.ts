import { jest } from '@jest/globals'

import { ChangeLog, ChangeLogDetail } from '@/models'
import { logChange, logHook } from '@/utils/change-logger'

beforeAll(() => {
  // @ts-ignore
  ChangeLog.create = jest.fn().mockResolvedValue({ id: 1 })
  // @ts-ignore
  ChangeLog.RELATIONS = { USER: 'User' }
  // @ts-ignore
  ChangeLog.RELATIONS_ID = { USER: 'userId' }
  // @ts-ignore
  ChangeLogDetail.create = jest.fn().mockResolvedValue({})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('calls to logChange and logHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call logChange with correct params', async () => {
    const instance = {
      id: 5,
      userId: 123,
      changed: () => ['username'],
      previous: () => 'oldname',
      getDataValue: (field: string) =>
        field === 'username' ? 'newname' : field === 'userId' ? 123 : undefined,
      get: (field: string) =>
        field === 'username' ? 'newname' : field === 'userId' ? 123 : undefined,
      dataValues: { username: 'newname', userId: 123 },
      constructor: { name: 'User' },
    } as any

    await logChange({
      instance,
      operation: 'update',
      userId: 123,
      modelName: ChangeLog.RELATIONS.USER,
      modelId: 5,
    })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('should call logHook on model update', async () => {
    const instance = {
      id: 10,
      userId: 10,
      changed: () => ['username'],
      previous: () => 'oldname',
      getDataValue: (field: string) =>
        field === 'username' ? 'newname' : field === 'userId' ? 10 : undefined,
      get: (field: string) =>
        field === 'username' ? 'newname' : field === 'userId' ? 10 : undefined,
      dataValues: { username: 'newname', userId: 10 },
      constructor: { name: 'User' },
    } as any

    await logHook('update', instance, { userId: 10 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })
})

describe('change-logger: logHook/logChange interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls logChange with correct args for update', async () => {
    const instance = {
      id: 5,
      userId: 1,
      changed: () => ['username'],
      previous: () => 'oldname',
      getDataValue: (field: string) =>
        field === 'username' ? 'newname' : field === 'userId' ? 1 : undefined,
      get: (field: string) =>
        field === 'id'
          ? 5
          : field === 'username'
            ? 'newname'
            : field === 'userId'
              ? 1
              : undefined,
      dataValues: { username: 'newname', userId: 1 },
      constructor: { name: 'User' },
    } as any

    await logHook('update', instance, { userId: 1 })

    expect(ChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ changedBy: 1, userId: 5, operation: 'update' }),
      expect.anything()
    )
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('calls logChange with correct args for multiple fields update', async () => {
    const instance = {
      id: 6,
      userId: 2,
      changed: () => ['username', 'email'],
      previous: (field: string) =>
        field === 'email' ? 'old@email.com' : 'olduser',
      getDataValue: (field: string) =>
        field === 'username'
          ? 'newuser'
          : field === 'email'
            ? 'new@email.com'
            : field === 'userId'
              ? 2
              : undefined,
      get: (field: string) =>
        field === 'username'
          ? 'newuser'
          : field === 'email'
            ? 'new@email.com'
            : field === 'userId'
              ? 2
              : undefined,
      dataValues: { username: 'newuser', email: 'new@email.com', userId: 2 },
      constructor: { name: 'User' },
    } as any

    await logHook('update', instance, { userId: 2 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('calls logChange for create operation', async () => {
    const instance = {
      id: 7,
      userId: 3,
      changed: () => [],
      previous: () => null,
      getDataValue: (field: string) =>
        field === 'username' ? 'brandnew' : field === 'userId' ? 3 : undefined,
      get: (field: string) =>
        field === 'username' ? 'brandnew' : field === 'userId' ? 3 : undefined,
      dataValues: { username: 'brandnew', userId: 3 },
      constructor: { name: 'User' },
    } as any

    await logHook('create', instance, { userId: 3 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('calls logChange for delete operation', async () => {
    const instance = {
      id: 8,
      userId: 4,
      changed: () => [],
      previous: () => null,
      getDataValue: (field: string) =>
        field === 'username' ? 'goneuser' : field === 'userId' ? 4 : undefined,
      get: (field: string) =>
        field === 'username' ? 'goneuser' : field === 'userId' ? 4 : undefined,
      dataValues: { username: 'goneuser', userId: 4 },
      constructor: { name: 'User' },
    } as any

    await logHook('delete', instance, { userId: 4 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('infers and logs link operation', async () => {
    const instance = {
      id: 9,
      userId: 5,
      changed: () => ['userId'],
      previous: () => 4,
      getDataValue: (field: string) => (field === 'userId' ? 10 : undefined),
      get: (field: string) => (field === 'userId' ? 10 : undefined),
      dataValues: { userId: 10 },
      constructor: { name: 'User' },
    } as any

    await logHook('update', instance, { userId: 5 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })

  it('infers and logs unlink operation', async () => {
    const instance = {
      id: 10,
      userId: 6,
      changed: () => ['userId'],
      previous: () => 10,
      getDataValue: (field: string) => (field === 'userId' ? null : undefined),
      get: (field: string) => (field === 'userId' ? null : undefined),
      dataValues: { userId: null },
      constructor: { name: 'User' },
    } as any

    await logHook('update', instance, { userId: 6 })

    expect(ChangeLog.create).toHaveBeenCalled()
    expect(ChangeLogDetail.create).toHaveBeenCalled()
  })
})
