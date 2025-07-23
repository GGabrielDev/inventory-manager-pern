import { Model, Transaction } from 'sequelize'

import { ChangeLog, ChangeLogDetail } from '@/models'
import { operationToDiffType, OperationType } from '@/models/ChangeLog'

type RELATIONS = (typeof ChangeLog.RELATIONS)[keyof typeof ChangeLog.RELATIONS]

type LogChangeProps = {
  instance: Model
  operation: OperationType
  userId: number
  modelName: RELATIONS
  modelId: number | string
  relation?: string // for link/unlink actions
  relatedId?: number | string // optional for association actions
  transaction?: Transaction
}

// Exporting for testing, not expected to be used standalone
export function inferOperation(instance: any, operation: OperationType) {
  if (operation === 'update') {
    const changedFields = instance.changed() as string[] // get changed fields
    if (changedFields.some((f) => f.endsWith('Id'))) {
      // You can further check if it's a new value (link) or set to null (unlink)
      return instance.getDataValue(
        changedFields.find((f) => f.endsWith('Id')!)!
      ) == null
        ? 'unlink'
        : 'link'
    }
  }
  return operation
}

export async function logChange({
  instance,
  operation,
  userId,
  modelName,
  modelId,
  relation,
  relatedId,
  transaction,
}: LogChangeProps) {
  const changedAt = new Date()
  const details: any[] = []

  const dataValues = instance.dataValues || {}
  const idFields = Object.keys(dataValues).filter((k) => k.endsWith('Id'))

  // Heuristic: join table if all fields are ...Id or known meta fields
  const metaFields = ['createdAt', 'updatedAt', 'deletedAt']
  const nonIdFields = Object.keys(dataValues).filter(
    (k) => !k.endsWith('Id') && !metaFields.includes(k)
  )
  const isJoinTable = idFields.length > 1 && nonIdFields.length === 0

  if (operation === 'update') {
    for (const key of Object.keys(dataValues)) {
      const prev = instance.previous(key)
      const curr = instance.get(key)
      if (prev !== curr) {
        details.push({
          field: key,
          oldValue: prev,
          newValue: curr,
          diffType: operationToDiffType('update'),
        })
      }
    }
    if (details.length === 0) return
  } else if (operation === 'create' || operation === 'delete') {
    for (const key of Object.keys(dataValues)) {
      details.push({
        field: key,
        oldValue: operation === 'create' ? null : instance.get(key),
        newValue: operation === 'create' ? instance.get(key) : null,
        diffType: operationToDiffType(operation),
      })
    }
  } else if (operation === 'link' || operation === 'unlink') {
    if (isJoinTable) {
      for (const fk of idFields) {
        details.push({
          field: fk,
          oldValue: operation === 'link' ? null : instance.get(fk),
          newValue: operation === 'link' ? instance.get(fk) : null,
          diffType: operationToDiffType(operation),
        })
      }
    } else {
      details.push({
        field: relation || 'relation',
        oldValue:
          operation === 'link'
            ? null
            : relation
              ? instance.previous?.(relation)
              : null,
        newValue: operation === 'link' ? relatedId : null,
        diffType: operationToDiffType(operation),
      })
    }
  }

  // Build dynamic object for ChangeLog associations
  const logData: any = {
    operation,
    changedBy: userId,
    changedAt,
    updatedAt: changedAt,
  }

  if (isJoinTable) {
    for (const fk of idFields) {
      logData[fk] = dataValues[fk]
    }
  } else {
    const fkField =
      ChangeLog.RELATIONS_ID[
        String(modelName).toUpperCase() as keyof typeof ChangeLog.RELATIONS_ID
      ]
    if (fkField) logData[fkField] = modelId
  }

  if (relation && relatedId) {
    logData.changeDetails = {
      ...(logData.changeDetails || {}),
      relation,
      relatedId,
    }
  }

  const changeLog = await ChangeLog.create(logData, { transaction })

  for (const detail of details) {
    try {
      await ChangeLogDetail.create(
        {
          changeLogId: changeLog.id,
          field: detail.field,
          oldValue: detail.oldValue,
          newValue: detail.newValue,
          diffType: detail.diffType,
          createdAt: changedAt,
          updatedAt: changedAt,
        },
        { transaction }
      )
    } catch (err) {
      console.error('Error creating ChangeLogDetail:', err)
    }
  }
}

export async function logHook(
  operation: OperationType,
  instance: Model,
  options: any
) {
  const actualOperation = inferOperation(instance, operation)

  const userId = options.userId || (options as any).userId
  if (typeof userId !== 'number' || userId == null)
    throw new Error('userId missing in options for logHook')

  const modelName = (instance.constructor as any).name
  const modelId = instance.get('id') as string | number

  let relation: string | undefined = undefined
  let relatedId: string | number | undefined = undefined

  if (actualOperation === 'link' || actualOperation === 'unlink') {
    const changedFields = instance.changed?.()
    if (Array.isArray(changedFields)) {
      const relField = changedFields.find((f) => f.endsWith('Id'))
      if (relField) {
        relation = relField
        const value = instance.get(relField)
        relatedId =
          typeof value === 'string' || typeof value === 'number'
            ? value
            : undefined
      }
    } else {
      // Fallback for bulk-created join models like UserRole
      if ('roleId' in instance && 'userId' in instance) {
        relation = 'roleId'
        const value = instance.get('roleId')
        relatedId =
          typeof value === 'string' || typeof value === 'number'
            ? value
            : undefined
      }
    }
  }

  // For direct User changes, record as relation to userId
  if (!relation && modelName === 'User') {
    relation = 'userId'
    relatedId = modelId
  }

  await logChange({
    instance,
    operation: actualOperation as OperationType,
    userId,
    modelName,
    modelId,
    relation,
    relatedId,
    transaction: options.transaction,
  })
}
