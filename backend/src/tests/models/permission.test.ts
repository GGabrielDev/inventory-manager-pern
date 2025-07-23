import { ChangeLog, Permission, User } from '@/models'

describe('Permission Model', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      { username: 'TestUser', passwordHash: 'pw' },
      { userId: 0 }
    )
  })

  it('should create a permission and log the action', async () => {
    const permission = await Permission.create(
      {
        name: 'readEntity',
        description: 'Allows reading entities',
      },
      { userId: systemUser.id }
    )

    const changeLogs = await ChangeLog.findAll({
      where: { permissionId: permission.id },
    })

    expect(permission).toBeDefined()
    expect(changeLogs.length).toBe(1)
    expect(changeLogs[0].operation).toBe('create')
  })

  it('should update a permission and log the action', async () => {
    const permission = await Permission.create(
      {
        name: 'writeEntity',
        description: 'Allows writing entities',
      },
      { userId: systemUser.id }
    )

    await permission.update(
      { description: 'Updated description' },
      { userId: systemUser.id }
    )

    const changeLogs = await ChangeLog.findAll({
      where: { permissionId: permission.id },
    })

    expect(changeLogs.length).toBe(2)
    expect(changeLogs[1].operation).toBe('update')
  })

  it('should delete a permission and log the action', async () => {
    const permission = await Permission.create(
      {
        name: 'deleteEntity',
        description: 'Allows deleting entities',
      },
      { userId: systemUser.id }
    )

    await permission.destroy({ userId: systemUser.id })

    const changeLogs = await ChangeLog.findAll({
      where: { permissionId: permission.id },
    })

    expect(changeLogs.length).toBe(2)
    expect(changeLogs[1].operation).toBe('delete')
  })

  it('should soft delete a permission and log the action', async () => {
    const permission = await Permission.create(
      {
        name: 'deleteEntity',
        description: 'Allows deleting entities',
      },
      { userId: systemUser.id }
    )

    await permission.destroy({ userId: systemUser.id })

    const deletedPermission = await Permission.findByPk(permission.id, {
      paranoid: false,
    })

    expect(deletedPermission).not.toBeNull()
    expect(deletedPermission!.deletedAt).not.toBeNull()

    const changeLogs = await ChangeLog.findAll({
      where: { permissionId: permission.id },
    })

    expect(changeLogs.length).toBe(2)
    expect(changeLogs[1].operation).toBe('delete')
  })

  it('should not allow duplicate permission names', async () => {
    await Permission.create(
      {
        name: 'writeEntity',
        description: 'Allows writing entities',
      },
      { userId: systemUser.id }
    )

    await expect(
      Permission.create(
        {
          name: 'writeEntity',
          description: 'Duplicate permission',
        },
        { userId: systemUser.id }
      )
    ).rejects.toThrow()
  })

  it('should require a name and description', async () => {
    await expect(
      Permission.create(
        {
          name: '',
          description: '',
        },
        { userId: systemUser.id }
      )
    ).rejects.toThrow(/Validation error/) // Check for validation error
  })

  it('should throw an error if userId is not provided', async () => {
    await expect(
      Permission.create({
        name: 'noUserId',
        description: 'Test without userId',
      })
    ).rejects.toThrow('userId required for changelog')
  })
})
