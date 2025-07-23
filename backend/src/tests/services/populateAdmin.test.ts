import { Permission, Role, User } from '@/models'
import populateAdminAndPermissions from '@/services/populateAdmin'

describe('populateAdminAndPermissions (integration)', () => {
  let consoleSpy: jest.SpyInstance

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('should create permissions', async () => {
    await populateAdminAndPermissions()

    const permissions = await Permission.findAll()
    const names = permissions.map((p) => p.name)
    expect(names).toEqual(
      expect.arrayContaining(['create_category', 'get_user'])
    )
  })

  it('should create an admin role', async () => {
    await populateAdminAndPermissions()

    const role = await Role.findOne({ where: { name: 'admin' } })
    expect(role).toBeTruthy()
    expect(role?.description).toBe('Administrator role with full permissions')
  })

  it('should create an admin user and associate with admin role', async () => {
    await populateAdminAndPermissions()

    const user = await User.findOne({ where: { username: 'admin' } })
    expect(user).toBeTruthy()
    // Check association
    const roles = await user!.$get(User.RELATIONS.ROLES)
    const roleNames = roles.map((r) => r.name)
    expect(roleNames).toContain('admin')
  })
})
