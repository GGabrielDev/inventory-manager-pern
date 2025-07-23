import 'sequelize'

import { User } from '@/models'

declare module 'sequelize' {
  interface CreateOptions {
    userId?: User['id']
  }
  interface BulkCreateOptions {
    userId?: User['id']
  }
  interface UpdateOptions {
    userId?: User['id']
  }
  interface SaveOptions {
    userId?: User['id']
  }
  interface DestroyOptions {
    userId?: User['id']
  }
  interface InstanceDestroyOptions {
    userId?: User['id']
  }
  interface FindOrCreateOptions {
    userId?: User['id']
  }
}
