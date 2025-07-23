import { Model } from 'sequelize-typescript'

import { UserActionOptions } from '@/types/UserActionOptions'
import { logHook } from '@/utils/change-logger'

export async function logEntityAction(
  action: 'create' | 'update' | 'delete',
  instanceOrInstances: Model | Model[],
  options: UserActionOptions | undefined,
  modelName: string
) {
  // If options is missing, skip logging (Sequelize internal/bulk calls)
  if (!options) return

  // If userId is missing or invalid, throw (user-initiated calls)
  if (typeof options.userId !== 'number' || options.userId == null) {
    throw new Error('userId required for changelog')
  }

  if (Array.isArray(instanceOrInstances)) {
    for (const instance of instanceOrInstances) {
      await logHook(action, instance, {
        userId: options.userId,
        modelName,
        modelId: instance.id,
        transaction: options.transaction,
      })
    }
  } else {
    await logHook(action, instanceOrInstances, {
      userId: options.userId,
      modelName,
      modelId: instanceOrInstances.id,
      transaction: options.transaction,
    })
  }
}
