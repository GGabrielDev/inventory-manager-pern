import express, { NextFunction, Request, Response, Router } from 'express'

import { CategoryController, ChangeLogController } from '@/controllers'
import { requirePermission } from '@/middlewares/authorization'

const categoryRouter: Router = express.Router()

// Create a new category
categoryRouter.post(
  '/',
  requirePermission('create_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body
      const userId = req.userId // Assume userId is set by authentication middleware

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const category = await CategoryController.createCategory(name, userId)
      res.status(201).json(category)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error) // Pass unknown errors to the next middleware
      }
    }
  }
)

// Get a category's changelogs
categoryRouter.get(
  '/changelogs/:id',
  requirePermission('get_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10)
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await ChangeLogController.getChangeLogsByCategoryId(
        categoryId,
        { page, pageSize }
      )

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

// Get a category by ID
categoryRouter.get(
  '/:id',
  requirePermission('get_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10)
      const category = await CategoryController.getCategoryById(categoryId)

      if (!category) {
        res.status(404).json({ error: 'Category not found' })
        return
      }

      res.json(category)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get all categorys with pagination
categoryRouter.get(
  '/',
  requirePermission('get_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await CategoryController.getAllCategories({
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

// Update a category
categoryRouter.put(
  '/:id',
  requirePermission('edit_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10)
      const { name } = req.body
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const updatedCategory = await CategoryController.updateCategory(
        categoryId,
        { name },
        userId
      )

      if (!updatedCategory) {
        res.status(404).json({ error: 'Category not found' })
        return
      }

      res.json(updatedCategory)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Delete a category
categoryRouter.delete(
  '/:id',
  requirePermission('delete_category'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10)
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const success = await CategoryController.deleteCategory(
        categoryId,
        userId
      )

      if (!success) {
        res.status(404).json({ error: 'Category not found' })
        return
      }

      res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

export default categoryRouter
