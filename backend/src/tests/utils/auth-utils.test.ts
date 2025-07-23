import { generateToken, verifyToken } from '@/utils/auth-utils'

describe('Auth Utils', () => {
  const userId = 123
  const secretKey = process.env.JWT_SECRET || 'your-secret-key'

  beforeAll(() => {
    process.env.JWT_SECRET = secretKey
    process.env.JWT_EXPIRE_TIME = '1h'
  })

  test('should generate a valid token', () => {
    const token = generateToken(userId)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT tokens have three parts
  })

  test('should verify a valid token and return the correct payload', () => {
    const token = generateToken(userId)
    const payload = verifyToken(token)
    expect(payload.userId).toBe(userId)
  })

  test('should throw an error for an invalid token', () => {
    const invalidToken = 'invalid.token.here'
    expect(() => verifyToken(invalidToken)).toThrow()
  })

  test('should throw an error for an invalid EXPIRE_TIME format', () => {
    process.env.JWT_EXPIRE_TIME = 'invalid-format'
    expect(() => generateToken(userId)).toThrow('Invalid EXPIRE_TIME format')
  })
})
