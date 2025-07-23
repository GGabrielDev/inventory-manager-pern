import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { ChangeLog } from '.'
import { DIFF_TYPES, DiffType } from './ChangeLog'

const RELATIONS = {
  CHANGELOG: 'changeLog',
} as const satisfies Record<string, keyof ChangeLogDetail>

@Table
export default class ChangeLogDetail extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => ChangeLog)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  changeLogId!: number

  @BelongsTo(() => ChangeLog)
  changeLog!: ChangeLog

  @AllowNull(false)
  @Column(DataType.STRING)
  field!: string

  @AllowNull(true)
  @Column(process.env.NODE_ENV === 'test' ? DataType.JSON : DataType.JSONB)
  oldValue?: unknown

  @AllowNull(true)
  @Column(process.env.NODE_ENV === 'test' ? DataType.JSON : DataType.JSONB)
  newValue?: unknown

  @AllowNull(true)
  @Column(process.env.NODE_ENV === 'test' ? DataType.JSON : DataType.JSONB)
  metadata?: object

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: { isIn: [DIFF_TYPES] },
  })
  diffType!: DiffType

  static readonly RELATIONS = RELATIONS
}
