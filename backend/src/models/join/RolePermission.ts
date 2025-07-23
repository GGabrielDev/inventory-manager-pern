import {
  AfterBulkCreate,
  AfterBulkDestroy,
  BeforeBulkDestroy,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'

import { ChangeLog, Permission, Role } from '@/models'
import { UserActionOptions } from '@/types/UserActionOptions'
import { logHook } from '@/utils/change-logger'

@Table({ tableName: 'RolePermissions', timestamps: false })
export default class RolePermission extends Model {
  @ForeignKey(() => Role)
  @Column
  roleId!: number

  @ForeignKey(() => Permission)
  @Column
  permissionId!: number

  // Add hooks for link/unlink
  @AfterBulkCreate
  static async logLink(
    instances: RolePermission[],
    options: UserActionOptions
  ) {
    if (typeof options.userId !== 'number' || options.userId == null)
      throw new Error('userId required for changelog')
    for (const instance of instances) {
      await logHook('link', instance, {
        userId: options.userId,
        modelName: 'RolePermission',
        modelId: instance.roleId,
        relation: ChangeLog.RELATIONS_ID.PERMISSION,
        relatedId: instance.permissionId,
        transaction: options.transaction,
      })
    }
  }

  @BeforeBulkDestroy
  static async cacheDestroyedInstances(options: any) {
    options.instancesToLog = await RolePermission.findAll({
      where: options.where,
    })
  }

  @AfterBulkDestroy
  static async logUnlink(options: any) {
    if (typeof options.userId !== 'number' || options.userId == null)
      throw new Error('userId required for changelog')
    for (const instance of options.instancesToLog || []) {
      await logHook('unlink', instance, {
        userId: options.userId,
        modelName: 'RolePermission',
        modelId: instance.roleId,
        relation: ChangeLog.RELATIONS_ID.PERMISSION,
        relatedId: instance.permissionId,
        transaction: options.transaction,
      })
    }
  }
}
