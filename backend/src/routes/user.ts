import express, { NextFunction, Request, Response, Router } from 'express'

import { ChangeLogController, UserController } from '@/controllers'
import { SortByOptions, UserFilterOptions } from '@/controllers/User'
import { requirePermission } from '@/middlewares/authorization'
import { User } from '@/models'

const userRouter: Router = express.Router()

// Create a new user
userRouter.post(
  '/',
  requirePermission('create_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, roleIds } = req.body
      const userId = req.userId // Assume userId is set by authentication middleware

      // Allow userId to be 0
      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const user = await UserController.createUser(
        username,
        password,
        userId,
        roleIds
      )
      res.status(201).json(await User.findByPk(user.id))
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get a user's changelogs
userRouter.get(
  '/changelogs/:id',
  requirePermission('get_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10)
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await ChangeLogController.getChangeLogsByUserId(userId, {
        page,
        pageSize,
      })

      res.json(result)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get a user by ID
userRouter.get(
  '/:id',
  requirePermission('get_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10)
      const user = await UserController.getUserById(userId)

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(user)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get all users with pagination and optional filters
userRouter.get(
  '/',
  requirePermission('get_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const username = (req.query.username as User['username']) || undefined
      const sortBy = SortByOptions.includes(req.query.sortBy as string)
        ? (req.query.sortBy as UserFilterOptions['sortBy'])
        : undefined
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC'

      const result = await UserController.getAllUsers({
        page,
        pageSize,
        username,
        sortBy,
        sortOrder,
      })

      res.json(result)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Update a user
userRouter.put(
  '/:id',
  requirePermission('edit_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10)
      const { username, password } = req.body
      let { roleIds } = req.body
      const actionUserId = req.userId

      // Allow actionUserId to be 0
      if (typeof actionUserId !== 'number') {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const updates: Partial<User> = {}
      if (username !== undefined) updates.username = username
      if (password !== undefined) updates.passwordHash = password
      if (roleIds === undefined) roleIds = []

      const updatedUser = await UserController.updateUser(
        userId,
        updates,
        actionUserId,
        roleIds
      )

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(updatedUser)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating user:', error.message)
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Delete a user
userRouter.delete(
  '/:id',
  requirePermission('delete_user'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10)
      const actionUserId = req.userId

      if (typeof actionUserId !== 'number') {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const success = await UserController.deleteUser(userId, actionUserId)

      if (!success) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error deleting user:', error.message)
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

export default userRouter
