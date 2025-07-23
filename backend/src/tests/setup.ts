import sequelize from '@/loaders/sequelize'

// Una sola instancia global que todos los tests usan
beforeAll(async () => {
  await sequelize.sync({ force: true }) // garantiza que esté todo limpio
})

// Despues de cada test individual
afterEach(async () => {
  // Clean all the tables without restarting the connection
  for (const model of Object.values(sequelize.models)) {
    await model.destroy({ where: {}, truncate: true, force: true, userId: 0 })
  }
})

// Cerrar conexión solo al final de todos los tests
afterAll(async () => {
  await sequelize.close()
})
