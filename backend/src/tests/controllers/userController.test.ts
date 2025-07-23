import { UserController } from '@/controllers'
import { Role, User } from '@/models'
import { verifyToken } from '@/utils/auth-utils'

describe('UserController', () => {
  let systemUser: User
  let adminRole: Role
  let userRole: Role

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )

    adminRole = await Role.create(
      {
        name: 'admin',
        description: 'Administrator',
      },
      { userId: systemUser.id }
    )

    userRole = await Role.create(
      {
        name: 'user',
        description: 'Regular User',
      },
      { userId: systemUser.id }
    )
  })

  it('should create a user with valid fields and roles', async () => {
    const user = await UserController.createUser(
      'testuser',
      'test',
      systemUser.id,
      [adminRole.id]
    )
    expect(user.id).toBeDefined()
    expect(user.username).toBe('testuser')

    const roles = await user.$get(User.RELATIONS.ROLES)
    expect(roles.length).toBe(1)
    expect(roles[0].name).toBe('admin')
  })

  it('should update a user and change roles', async () => {
    const user = await UserController.createUser(
      'updateuser',
      'test',
      systemUser.id,
      [adminRole.id]
    )

    const updatedUser = await UserController.updateUser(
      user.id,
      { username: 'updated' },
      systemUser.id,
      [userRole.id]
    )
    expect(updatedUser).toBeDefined()
    expect(updatedUser?.username).toBe('updated')

    const roles = await updatedUser?.$get(User.RELATIONS.ROLES)
    expect(roles?.length).toBe(1)
    expect(roles?.[0].name).toBe('user')
  })

  it('should get a user by ID', async () => {
    const createdUser = await UserController.createUser(
      'getuser',
      'test',
      systemUser.id
    )
    const user = await UserController.getUserById(createdUser.id)
    expect(user).toBeDefined()
    expect(user?.username).toBe('getuser')
  })

  it('should get all users with pagination', async () => {
    await UserController.createUser('user1', 'test', systemUser.id)
    await UserController.createUser('user2', 'test', systemUser.id)

    const result = await UserController.getAllUsers({ page: 1, pageSize: 1 })
    expect(result.data.length).toBe(1)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('should delete a user', async () => {
    const user = await UserController.createUser(
      'deleteuser',
      'test',
      systemUser.id
    )
    const result = await UserController.deleteUser(user.id, systemUser.id)
    expect(result).toBe(true)

    const deletedUser = await User.findByPk(user.id)
    expect(deletedUser).toBeNull()
  })

  it('should not find a non-existent user', async () => {
    const user = await UserController.getUserById(9999)
    expect(user).toBeNull()
  })

  it('should handle unique username constraint', async () => {
    await UserController.createUser('uniqueuser', 'test', systemUser.id)
    await expect(
      UserController.createUser('uniqueuser', 'test', systemUser.id)
    ).rejects.toThrow()
  })
})

describe('UserController - Login and Authentication', () => {
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

  it('should login a user with valid credentials', async () => {
    const token = await UserController.login('systemUser', 'password')
    expect(token).toBeDefined()

    const decoded = verifyToken(token)
    expect(decoded.userId).toBe(systemUser.id)
  })

  it('should throw an error for invalid username', async () => {
    await expect(
      UserController.login('invalidUser', 'password')
    ).rejects.toThrow('Invalid username or password')
  })

  it('should throw an error for invalid password', async () => {
    await expect(
      UserController.login('systemUser', 'wrongpassword')
    ).rejects.toThrow('Invalid username or password')
  })
})

describe('UserController - Edge Cases and Invalid Inputs', () => {
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

  it('should throw an error if username is missing when creating a user', async () => {
    await expect(
      UserController.createUser('', 'test', systemUser.id)
    ).rejects.toThrow('Validation error')
  })

  it('should throw an error if password is missing when creating a user', async () => {
    await expect(
      UserController.createUser('nousername', '', systemUser.id)
    ).rejects.toThrow('Validation error')
  })

  it('should throw an error if userId is invalid when creating a user', async () => {
    await expect(
      UserController.createUser('invaliduser', 'test', -1)
    ).rejects.toThrow('Invalid userId')
  })

  it('should return null if trying to update a non-existent user', async () => {
    const result = await UserController.updateUser(
      9999,
      { username: 'newname' },
      systemUser.id
    )
    expect(result).toBeNull()
  })

  it('should return false if trying to delete a non-existent user', async () => {
    const result = await UserController.deleteUser(9999, systemUser.id)
    expect(result).toBe(false)
  })

  it('should handle invalid page number in pagination', async () => {
    const result = await UserController.getAllUsers({ page: -1, pageSize: 1 })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle invalid page size in pagination', async () => {
    const result = await UserController.getAllUsers({ page: 1, pageSize: -1 })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric userId in getUserById', async () => {
    await expect(UserController.getUserById(NaN)).rejects.toThrow(
      'Invalid userId'
    )
  })
})

describe('UserController – filters', () => {
  let systemUser: User

  beforeEach(async () => {
    systemUser = await User.create(
      {
        username: 'systemUser',
        passwordHash: 'password',
      },
      { userId: 0 }
    )
    await UserController.createUser('userA', 'pass', systemUser.id)
    await UserController.createUser('userB', 'pass', systemUser.id)
    await UserController.createUser('userC', 'pass', systemUser.id)
  })

  it('controller filters by name', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      username: 'userB',
    })
    expect(result.data.map((u) => u.username)).toEqual(['userB'])
    expect(result.total).toBe(1)
  })
})

describe('UserController – sorting', () => {
  let systemUser: User

  beforeEach(async () => {
    const createTimestamps = [
      new Date('2025-01-01'),
      new Date('2025-02-01'),
      new Date('2025-03-01'),
      new Date('2025-04-01'),
    ]

    systemUser = await User.create(
      {
        username: 'user3',
        passwordHash: 'password',
        creationDate: createTimestamps[3],
      },
      { userId: 0 }
    )
    for (let i = 0; i < 3; i++) {
      await User.create(
        {
          username: `user${i}`,
          passwordHash: 'pass',
          creationDate: createTimestamps[i],
        },
        { userId: systemUser.id }
      )
    }
  })

  const getSortedUsernames = (users: any[]) => users.map((u) => u.username)

  it('sorts by username ASC', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'username',
      sortOrder: 'ASC',
    })
    expect(getSortedUsernames(result.data)).toEqual([
      'user0',
      'user1',
      'user2',
      'user3',
    ])
  })

  it('sorts by username DESC', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'username',
      sortOrder: 'DESC',
    })
    expect(getSortedUsernames(result.data)).toEqual([
      'user3',
      'user2',
      'user1',
      'user0',
    ])
  })

  it('sorts by creationDate ASC (createdAt)', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'creationDate',
      sortOrder: 'ASC',
    })
    expect(getSortedUsernames(result.data)).toEqual([
      'user0',
      'user1',
      'user2',
      'user3',
    ])
  })

  it('sorts by creationDate DESC (createdAt)', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'creationDate',
      sortOrder: 'DESC',
    })
    expect(getSortedUsernames(result.data)).toEqual([
      'user3',
      'user2',
      'user1',
      'user0',
    ])
  })

  it('sorts by updatedOn ASC (updatedAt) (uses sequelize asigned date))', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'updatedOn',
      sortOrder: 'ASC',
    })

    console.log(result.data.map((results: any) => results.updatedOn))

    expect(getSortedUsernames(result.data)).toEqual([
      'user3',
      'user0',
      'user1',
      'user2',
    ])
  })

  it('sorts by updatedOn DESC (updatedAt) (uses sequelize asigned date)', async () => {
    const result = await UserController.getAllUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'updatedOn',
      sortOrder: 'DESC',
    })
    expect(getSortedUsernames(result.data)).toEqual([
      'user2',
      'user1',
      'user0',
      'user3',
    ])
  })
})
