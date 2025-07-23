import express, { NextFunction, Request, Response, Router } from 'express'

import { ChangeLogController, DepartmentController } from '@/controllers'
import { requirePermission } from '@/middlewares/authorization'

const departmentRouter: Router = express.Router()

// Create a new department
departmentRouter.post(
  '/',
  requirePermission('create_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body
      const userId = req.userId // Assume userId is set by authentication middleware

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const department = await DepartmentController.createDepartment(
        name,
        userId
      )
      res.status(201).json(department)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error) // Pass unknown errors to the next middleware
      }
    }
  }
)

// Get a department's changelogs
departmentRouter.get(
  '/changelogs/:id',
  requirePermission('get_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id, 10)
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await ChangeLogController.getChangeLogsByDepartmentId(
        departmentId,
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

// Get a department by ID
departmentRouter.get(
  '/:id',
  requirePermission('get_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id, 10)
      const department =
        await DepartmentController.getDepartmentById(departmentId)

      if (!department) {
        res.status(404).json({ error: 'Department not found' })
        return
      }

      res.json(department)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Get all departments with pagination
departmentRouter.get(
  '/',
  requirePermission('get_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10
      const result = await DepartmentController.getAllDepartments({
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

// Update a department
departmentRouter.put(
  '/:id',
  requirePermission('edit_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id, 10)
      const { name } = req.body
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const updatedDepartment = await DepartmentController.updateDepartment(
        departmentId,
        { name },
        userId
      )

      if (!updatedDepartment) {
        res.status(404).json({ error: 'Department not found' })
        return
      }

      res.json(updatedDepartment)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
)

// Delete a department
departmentRouter.delete(
  '/:id',
  requirePermission('delete_department'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id, 10)
      const userId = req.userId

      if (typeof userId !== 'number' || userId < 0) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const success = await DepartmentController.deleteDepartment(
        departmentId,
        userId
      )

      if (!success) {
        res.status(404).json({ error: 'Department not found' })
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

export default departmentRouter
