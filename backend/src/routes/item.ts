import express, { NextFunction, Request, Response, Router } from 'express'

import { ChangeLogController, ItemController } from '@/controllers'
import { ItemFilterOptions, validSortByOptions } from '@/controllers/Item'
import { requirePermission } from '@/middlewares/authorization'

const itemRouter: Router = express.Router()

// Create a new item
itemRouter.post(
  '/',
  requirePermission('create_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, quantity, unit, categoryId, departmentId } = req.body
      const userId = req.userId // Assume userId is set by authentication middleware

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const item = await ItemController.createItem(
        name,
        departmentId,
        userId,
        quantity,
        unit,
        categoryId
      )
      res.status(201).json(item)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error) // Pass unknown errors to the next middleware
      }
    }
  }
)

// Get a item by ID
itemRouter.get(
  '/:id',
  requirePermission('get_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = parseInt(req.params.id, 10)
      const item = await ItemController.getItemById(itemId)

      if (!item) {
        res.status(404).json({ error: 'Item not found' })
        return
      }

      res.json(item)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get a item's changelogs
itemRouter.get(
  '/changelogs/:id',
  requirePermission('get_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = parseInt(req.params.id, 10)
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await ChangeLogController.getChangeLogsByItemId(itemId, {
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

// Get all items with pagination, filtering, and sorting
itemRouter.get(
  '/',
  requirePermission('get_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const name = (req.query.name as string) || undefined
      const department = (req.query.department as string) || undefined
      const category = (req.query.category as string) || undefined
      // Use the imported validSortByOptions
      const sortBy = validSortByOptions.includes(req.query.sortBy as any)
        ? (req.query.sortBy as ItemFilterOptions['sortBy'])
        : undefined
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC'

      const result = await ItemController.getAllItems({
        page,
        pageSize,
        name,
        department,
        category,
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

// Update a item
itemRouter.put(
  '/:id',
  requirePermission('edit_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = parseInt(req.params.id, 10)
      const { name, quantity, unit, categoryId, departmentId } = req.body
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const updatedItem = await ItemController.updateItem(
        itemId,
        { name, quantity, unit, categoryId, departmentId },
        userId
      )

      if (!updatedItem) {
        res.status(404).json({ error: 'Item not found' })
        return
      }

      res.json(updatedItem)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Delete a item
itemRouter.delete(
  '/:id',
  requirePermission('delete_item'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = parseInt(req.params.id, 10)
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const success = await ItemController.deleteItem(itemId, userId)

      if (!success) {
        res.status(404).json({ error: 'Item not found' })
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

export default itemRouter
