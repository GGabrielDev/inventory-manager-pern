import {
  AfterBulkCreate,
  AfterBulkDestroy,
  AfterBulkUpdate,
  AfterCreate,
  AfterDestroy,
  AfterUpdate,
  AllowNull,
  AutoIncrement,
  BeforeDestroy,
  BelongsToMany,
  Column,
  CreatedAt,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript'

import { UserActionOptions } from '@/types/UserActionOptions'
import { logEntityAction } from '@/utils/entity-hooks'

import { ChangeLog, Permission, User } from '.'
import { RolePermission, UserRole } from './join'

const RELATIONS = {
  CHANGELOGS: 'changeLogs',
  PERMISSIONS: 'permissions',
  USERS: 'users',
} as const satisfies Record<string, keyof Role>

@Table
export default class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @AllowNull(false)
  @Unique
  @Column
  name!: string

  @AllowNull(true)
  @Column
  description?: string

  @CreatedAt
  creationDate!: Date

  @UpdatedAt
  updatedOn!: Date

  @DeletedAt
  deletionDate?: Date

  @BelongsToMany(() => User, () => UserRole)
  users!: Array<User & { UserRole: UserRole }>

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions!: Array<Permission & { RolePermission: RolePermission }>

  @HasMany(() => ChangeLog)
  changeLogs!: ChangeLog[]

  static readonly RELATIONS = RELATIONS

  @AfterCreate
  @AfterBulkCreate
  static async logCreate(instance: Role | Role[], options: UserActionOptions) {
    await logEntityAction('create', instance, options, ChangeLog.RELATIONS.ROLE)
  }

  @AfterUpdate
  @AfterBulkUpdate
  static async logUpdate(instance: Role | Role[], options: UserActionOptions) {
    await logEntityAction('update', instance, options, ChangeLog.RELATIONS.ROLE)
  }

  @BeforeDestroy
  static async checkUsersBeforeDestroy(instance: Role) {
    const userCount = await instance.$count(Role.RELATIONS.USERS)
    if (userCount > 0) {
      throw new Error('Cannot delete role with assigned users.')
    }
  }

  @AfterDestroy
  @AfterBulkDestroy
  static async logDestroy(instance: Role | Role[], options: UserActionOptions) {
    await logEntityAction('delete', instance, options, ChangeLog.RELATIONS.ROLE)
  }
}
