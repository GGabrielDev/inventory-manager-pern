import sequelize from '@/loaders/sequelize'

describe('Database connection', () => {
  it('should authenticate successfully', async () => {
    await expect(sequelize.authenticate()).resolves.toBeUndefined()
  })
})
