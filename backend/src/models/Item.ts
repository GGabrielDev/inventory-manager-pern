import {
  AfterBulkCreate,
  AfterBulkDestroy,
  AfterBulkUpdate,
  AfterCreate,
  AfterDestroy,
  AfterUpdate,
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
  Validate,
} from 'sequelize-typescript'

import { UserActionOptions } from '@/types/UserActionOptions'
import { logEntityAction } from '@/utils/entity-hooks'

import { Category, ChangeLog, Department } from '.'

const RELATIONS = {
  CATEGORY: 'category',
  CHANGELOGS: 'changeLogs',
  DEPARTMENT: 'department',
} as const satisfies Record<string, keyof Item>

export enum UnitType {
  UND = 'und.',
  KG = 'kg',
  L = 'l',
  M = 'm',
}

@Table
export default class Item extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @AllowNull(false)
  @Unique
  @Column
  name!: string

  @AllowNull(false)
  @Default(1)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
    },
  })
  quantity!: number

  @AllowNull(false)
  @Default(UnitType.UND)
  @Validate({
    isInEnum(value: string) {
      if (!Object.values(UnitType).includes(value as UnitType)) {
        throw new Error(`Invalid unit: ${value}`)
      }
    },
  })
  @Column(DataType.ENUM(UnitType.UND))
  unit!: UnitType

  @CreatedAt
  creationDate!: Date

  @UpdatedAt
  updatedOn!: Date

  @DeletedAt
  deletionDate?: Date

  @ForeignKey(() => Category)
  @AllowNull(true)
  @Column
  categoryId?: number

  @ForeignKey(() => Department)
  @AllowNull(false)
  @Column
  departmentId!: number

  @BelongsTo(() => Category, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  category?: Category

  @BelongsTo(() => Department, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  department?: Department

  @HasMany(() => ChangeLog)
  changeLogs!: ChangeLog[]

  static readonly RELATIONS = RELATIONS

  @AfterCreate
  @AfterBulkCreate
  static async logCreate(instance: Item | Item[], options: UserActionOptions) {
    await logEntityAction('create', instance, options, ChangeLog.RELATIONS.ITEM)
  }

  @AfterUpdate
  @AfterBulkUpdate
  static async logUpdate(instance: Item | Item[], options: UserActionOptions) {
    await logEntityAction('update', instance, options, ChangeLog.RELATIONS.ITEM)
  }

  @AfterDestroy
  @AfterBulkDestroy
  static async logDestroy(instance: Item | Item[], options: UserActionOptions) {
    await logEntityAction('delete', instance, options, ChangeLog.RELATIONS.ITEM)
  }
}
