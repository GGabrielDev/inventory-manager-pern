import 'sequelize-typescript'

import { User } from '@/models'

declare module 'sequelize-typescript' {
  interface AssociationActionOptions {
    userId?: User['id']
  }
}
