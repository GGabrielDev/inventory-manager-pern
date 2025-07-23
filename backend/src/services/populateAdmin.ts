import { Permission, Role, User } from '@/models'

const entities = [
  'Category',
  'ChangeLog',
  'ChangeLogDetail',
  'Department',
  'Item',
  'Permission',
  'Role',
  'User',
]

const actions = ['create', 'get', 'edit', 'delete']

const permissions = entities.flatMap((entity) =>
  actions.map((action) => ({
    name: `${action}_${entity.toLowerCase()}`,
    description: `Allows a user to ${action} a ${entity}`,
  }))
)

export type PermissionType =
  `${(typeof actions)[number]}_${Lowercase<(typeof entities)[number]>}`

async function populateAdminAndPermissions() {
  try {
    // 1. Create admin user first
    const [adminUser, userCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        passwordHash: 'admin',
      },
      userId: 0,
    })

    // 2. Use adminUser.id for all subsequent creates
    const userId = adminUser.id

    // 3. Create permissions
    const createdPermissions = await Permission.bulkCreate(permissions, {
      ignoreDuplicates: true,
      userId,
    })

    // 4. Create admin role
    const [adminRole, roleCreated] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { description: 'Administrator role with full permissions' },
      userId,
    })

    // 5. Associate admin role and permissions (many-to-many)
    await adminRole.$set(Role.RELATIONS.PERMISSIONS, createdPermissions, {
      userId,
    })

    // 6. Associate admin user and admin role (many-to-many)
    await adminUser.$set(User.RELATIONS.ROLES, adminRole, { userId })

    if (roleCreated) {
      console.log('Admin role created')
    } else {
      console.log('Admin role already exists')
    }

    if (userCreated) {
      console.log('Admin user created')
    } else {
      console.log('Admin user already exists')
    }
  } catch (error) {
    console.error('Error populating admin and permissions:', error)
  }
}

export default populateAdminAndPermissions
