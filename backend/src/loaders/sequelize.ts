import { Sequelize } from 'sequelize-typescript'

import { dbConfig } from '@/config'
import { ModelsArray } from '@/models'

const sequelize = new Sequelize({
  ...dbConfig,
  models: ModelsArray,
  define: {
    timestamps: true,
  },
})

export default sequelize
