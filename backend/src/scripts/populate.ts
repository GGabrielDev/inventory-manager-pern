/// <reference path="../types/sequelize.d.ts" />
/// <reference path="../types/sequelize-typescript.d.ts" />
/// <reference path="../types/express.d.ts" />

import sequelize from '@/loaders/sequelize'
import populateAdminAndPermissions from '@/services/populateAdmin'

async function run() {
  try {
    await sequelize.authenticate() // Ensure the connection is established
    await sequelize.sync() // Ensure the models are synchronized with the database

    await populateAdminAndPermissions()
    console.log('Admin and permissions populated successfully.')
  } catch (error) {
    console.error('Error populating admin and permissions:', error)
  }
}

run()
