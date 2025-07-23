/// <reference path="./types/express.d.ts" />
/// <reference path="./types/sequelize.d.ts" />
/// <reference path="./types/sequelize-typescript.d.ts" />

import dotenv from 'dotenv'

import app from './app'
import sequelize from './loaders/sequelize'

dotenv.config()

const PORT = process.env.PORT || 4000

async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection has been established successfully.')

    await sequelize.sync()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error)
    process.exit(1)
  }
}

startServer()
