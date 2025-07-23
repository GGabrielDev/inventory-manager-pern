import { Category } from '@/models'

interface PaginationOptions {
  page: number
  pageSize: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
}

export class CategoryController {
  // Create a new category
  static async createCategory(
    name: Category['name'],
    userId: number
  ): Promise<Category> {
    if (!name) {
      throw new Error('Validation error: Category name is required')
    }
    if (typeof userId !== 'number' || userId < 0) {
      throw new Error('Invalid userId')
    }

    return Category.create({ name }, { userId })
  }

  // Get a category by ID
  static async getCategoryById(categoryId: number): Promise<Category | null> {
    if (typeof categoryId !== 'number' || isNaN(categoryId)) {
      throw new Error('Invalid categoryId')
    }

    return Category.findByPk(categoryId, {
      include: [Category.RELATIONS.ITEMS],
    })
  }

  // Get all categories with pagination
  static async getAllCategories({
    page,
    pageSize,
  }: PaginationOptions): Promise<PaginatedResult<Category>> {
    if (page < 1 || pageSize < 1) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      }
    }

    const offset = (page - 1) * pageSize
    const { count, rows } = await Category.findAndCountAll({
      offset,
      limit: pageSize,
    })

    return {
      data: rows,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    }
  }

  // Update a category
  static async updateCategory(
    categoryId: number,
    updates: Partial<Category>,
    actionUserId: number
  ): Promise<Category | null> {
    if (typeof categoryId !== 'number' || isNaN(categoryId)) {
      throw new Error('Invalid categoryId')
    }

    const category = await Category.findByPk(categoryId)
    if (!category) return null

    await category.update(updates, { userId: actionUserId })
    return category
  }

  // Delete a category
  static async deleteCategory(
    categoryId: number,
    actionUserId: number
  ): Promise<boolean> {
    if (typeof categoryId !== 'number' || isNaN(categoryId)) {
      throw new Error('Invalid categoryId')
    }

    const category = await Category.findByPk(categoryId)
    if (!category) return false

    const itemCount = await category.$count('items')
    if (itemCount > 0) {
      throw new Error('Cannot delete category with assigned items.')
    }

    await category.destroy({ userId: actionUserId })
    return true
  }
}
