import sequelize from '@/loaders/sequelize'

async function clearDatabase() {
  try {
    await sequelize.sync({ force: true })
    console.log('Database cleared successfully.')
  } catch (error) {
    console.error('Error clearing the database:', error)
  }
}

clearDatabase()
