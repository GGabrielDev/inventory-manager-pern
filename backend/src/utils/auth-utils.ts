import jwt, { SignOptions } from 'jsonwebtoken'
import { StringValue } from 'ms'

export const SECRET_KEY: string = process.env.JWT_SECRET || 'your-secret-key'

// Function to check if a value is a valid time format or a number
function isValidExpireTime(value: string): boolean {
  // Check if it's a number
  if (!isNaN(Number(value))) {
    return true
  }
  // Check if it's a valid string format like '1h', '2d', etc.
  const regex = /^[0-9]+[smhd]$/ // Matches formats like '1s', '2m', '3h', '4d'
  return regex.test(value)
}

export function generateToken(userId: number): string {
  const expireTime = process.env.JWT_EXPIRE_TIME || '1h'
  if (!isValidExpireTime(expireTime)) {
    throw new Error('Invalid EXPIRE_TIME format')
  }
  const options: SignOptions = { expiresIn: expireTime as StringValue | number }
  return jwt.sign({ userId }, SECRET_KEY, options)
}

export function verifyToken(token: string): { userId: number } {
  return jwt.verify(token, SECRET_KEY) as { userId: number }
}
