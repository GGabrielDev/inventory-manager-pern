import express, { NextFunction, Request, Response, Router } from 'express'

import { RoleController } from '@/controllers'
import { requirePermission } from '@/middlewares/authorization'

const roleRouter: Router = express.Router()

// Create a new role
roleRouter.post(
  '/',
  requirePermission('create_role'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, permissionIds } = req.body
      const userId = req.userId // Assume userId is set by authentication middleware

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const role = await RoleController.createRole(
        name,
        description,
        userId,
        permissionIds
      )
      res.status(201).json(role)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error) // Pass unknown errors to the next middleware
      }
    }
  }
)

// Get a role by ID
roleRouter.get(
  '/:id',
  requirePermission('get_role'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = parseInt(req.params.id, 10)
      const role = await RoleController.getRoleById(roleId)

      if (!role) {
        res.status(404).json({ error: 'Role not found' })
        return
      }

      res.json(role)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get all roles with pagination
roleRouter.get(
  '/',
  requirePermission('get_role'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await RoleController.getAllRoles({ page, pageSize })

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

// Update a role
roleRouter.put(
  '/:id',
  requirePermission('edit_role'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = parseInt(req.params.id, 10)
      const { name, description, permissionIds } = req.body
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const updatedRole = await RoleController.updateRole(
        roleId,
        { name, description },
        userId,
        permissionIds
      )

      if (!updatedRole) {
        res.status(404).json({ error: 'Role not found' })
        return
      }

      res.json(updatedRole)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Delete a role
roleRouter.delete(
  '/:id',
  requirePermission('delete_role'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = parseInt(req.params.id, 10)
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const success = await RoleController.deleteRole(roleId, userId)

      if (!success) {
        res.status(404).json({ error: 'Role not found' })
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

export default roleRouter
