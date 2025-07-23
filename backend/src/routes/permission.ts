import express, { Request, Response, Router } from 'express'

import { PermissionController } from '@/controllers'
import { requirePermission } from '@/middlewares/authorization'

const permissionRouter: Router = express.Router()

// Get a permission by ID
permissionRouter.get(
  '/:id',
  requirePermission('get_permission'),
  async (req: Request, res: Response) => {
    try {
      const permissionId = parseInt(req.params.id, 10)
      const permission =
        await PermissionController.getPermissionById(permissionId)
      if (permission) {
        res.json(permission)
      } else {
        res.status(404).json({ error: 'Permission not found' })
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' })
      }
    }
  }
)

// Get all permissions with pagination
permissionRouter.get(
  '/',
  requirePermission('get_permission'),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await PermissionController.getAllPermissions({
        page,
        pageSize,
      })
      res.json(result)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' })
      }
    }
  }
)

export default permissionRouter
