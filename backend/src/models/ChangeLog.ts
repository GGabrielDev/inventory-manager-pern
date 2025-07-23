import {
  AllowNull,
  AutoIncrement,
  BeforeValidate,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import {
  Category,
  ChangeLogDetail,
  Department,
  Item,
  Permission,
  Role,
  User,
} from '.'

const RELATIONS = {
  CHANGELOG_DETAILS: 'changeLogDetails',
  CATEGORY: 'category',
  DEPARTMENT: 'department',
  ITEM: 'item',
  PERMISSION: 'permission',
  ROLE: 'role',
  USER: 'user',
} as const satisfies Record<string, keyof ChangeLog>

const RELATIONS_ID = {
  CATEGORY: 'categoryId',
  DEPARTMENT: 'departmentId',
  ITEM: 'itemId',
  PERMISSION: 'permissionId',
  ROLE: 'roleId',
  USER: 'userId',
}

export const OPERATION_TYPES = [
  'create',
  'update',
  'delete',
  'link',
  'unlink',
] as const

export type OperationType = (typeof OPERATION_TYPES)[number]

// Map OperationType to DiffType
export const OPERATION_TO_DIFF_TYPE = {
  create: 'added',
  link: 'added',
  update: 'changed',
  delete: 'removed',
  unlink: 'removed',
} as const

export type DiffType = (typeof OPERATION_TO_DIFF_TYPE)[OperationType]

// Export valid diff types for use in ChangeLogDetail
export const DIFF_TYPES = Array.from(
  new Set(Object.values(OPERATION_TO_DIFF_TYPE))
) as DiffType[]

// Helper to convert operation to diffType
export function operationToDiffType(op: OperationType): DiffType {
  return OPERATION_TO_DIFF_TYPE[op]
}

@Table
export default class ChangeLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...OPERATION_TYPES),
    validate: { isIn: [OPERATION_TYPES as unknown as string[]] },
  })
  operation!: OperationType

  @Column(process.env.NODE_ENV === 'test' ? DataType.JSON : DataType.JSONB)
  changeDetails?: object

  @CreatedAt
  changedAt!: Date

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  changedBy!: User['id']

  @BelongsTo(() => User)
  user!: User

  @Column(DataType.INTEGER)
  userId?: User['id']

  @ForeignKey(() => Item)
  @Column(DataType.INTEGER)
  itemId?: Item['id']

  @BelongsTo(() => Item)
  item?: Item

  @ForeignKey(() => Category)
  @Column(DataType.INTEGER)
  categoryId?: Category['id']

  @BelongsTo(() => Category)
  category?: Category

  @ForeignKey(() => Role)
  @Column(DataType.INTEGER)
  roleId?: Role['id']

  @BelongsTo(() => Role)
  role?: Role

  @ForeignKey(() => Department)
  @Column(DataType.INTEGER)
  departmentId?: Department['id']

  @BelongsTo(() => Department)
  department?: Department

  @ForeignKey(() => Permission)
  @Column(DataType.INTEGER)
  permissionId?: Permission['id']

  @BelongsTo(() => Permission)
  permission?: Permission

  @HasMany(() => ChangeLogDetail)
  changeLogDetails!: ChangeLogDetail[]

  static readonly RELATIONS = RELATIONS

  static readonly RELATIONS_ID = RELATIONS_ID

  @BeforeValidate
  static enforceAtLeastOneAssociation(instance: ChangeLog) {
    if (
      !Object.values(ChangeLog.RELATIONS_ID)
        .filter((field): field is keyof ChangeLog => field in instance)
        .some((field) => Boolean(instance[field]))
    ) {
      throw new Error('ChangeLog: At least one association must be set.')
    }
  }
}
