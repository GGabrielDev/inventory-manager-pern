import {
  AfterBulkCreate,
  AfterBulkDestroy,
  BeforeBulkDestroy,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'

import { Role, User } from '@/models'
import { UserActionOptions } from '@/types/UserActionOptions'
import { logHook } from '@/utils/change-logger'

@Table({ tableName: 'UserRoles', timestamps: false })
export default class UserRole extends Model {
  @ForeignKey(() => User)
  @Column
  userId!: number

  @ForeignKey(() => Role)
  @Column
  roleId!: number

  // Add hooks for link/unlink
  @AfterBulkCreate
  static async logLink(instances: UserRole[], options: UserActionOptions) {
    if (typeof options.userId !== 'number' || options.userId == null)
      throw new Error('userId required for changelog')
    for (const instance of instances) {
      await logHook('link', instance, {
        userId: options.userId,
        modelName: 'UserRole',
        modelId: instance.userId,
        relation: 'roleId',
        relatedId: instance.roleId,
        transaction: options.transaction,
      })
    }
  }

  @BeforeBulkDestroy
  static async cacheDestroyedInstances(options: any) {
    // Find affected instances and attach to options
    options.instancesToLog = await UserRole.findAll({ where: options.where })
  }

  @AfterBulkDestroy
  static async logUnlink(options: any) {
    if (typeof options.userId !== 'number' || options.userId == null)
      throw new Error('userId required for changelog')
    // Log each deleted instance
    for (const instance of options.instancesToLog || []) {
      await logHook('unlink', instance, {
        userId: options.userId,
        modelName: 'UserRole',
        modelId: instance.userId,
        relation: 'roleId',
        relatedId: instance.roleId,
        transaction: options.transaction,
      })
    }
  }
}
