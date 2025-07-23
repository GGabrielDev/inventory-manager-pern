import express, { Request, Response, Router } from 'express'

import { UserController } from '../controllers'

const authRouter: Router = express.Router()

authRouter.post(
  '/login',
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body

    // Validate request body
    if (!username) {
      res.status(400).json({ error: 'Username is required' })
      return
    }
    if (!password) {
      res.status(400).json({ error: 'Password is required' })
      return
    }

    try {
      const token = await UserController.login(username, password)
      res.json({ token })
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' })
      }
    }
  }
)

export default authRouter
