// services/category.service.ts
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { CategoryDocument, CategoryModel } from '../models/category.model';
import { AppError } from '../utils/AppError';

interface FindAllOptions {
  filter?: FilterQuery<CategoryDocument>;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  parentId?: string;
  select?: string;
}

interface UpdateOptions {
  validateBeforeUpdate?: boolean;
  select?: string;
}

export class CategoryService {
  static async create(categoryData: Partial<CategoryDocument>, userId: string): Promise<CategoryDocument> {
    if (!categoryData.name) {
      throw AppError.ValidationError([
        { field: 'name', message: 'Category name is required' }
      ]);
    }

    // Check if slug already exists
    const slug = categoryData.slug || slugify(categoryData.name, { lower: true });
    const existingCategory = await CategoryModel.findOne({ slug });
    if (existingCategory) {
      throw AppError.BadRequest('Slug already exists', [
        { field: 'name', message: 'A category with this name already exists' }
      ]);
    }

    try {
      const category = await CategoryModel.create({
        ...categoryData,
        createdBy: userId,
        updatedBy: userId
      });

      // Update parent's isLeaf status if exists
      if (category.parentId) {
        await CategoryModel.findByIdAndUpdate(category.parentId, {
          isLeaf: false
        });
      }

      return category;
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }
      throw AppError.DatabaseError('Error creating category');
    }
  }

  static async findById(
    id: string,
    options: { populate?: boolean } = {}
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format', [
        { field: 'id', message: 'The provided ID is not valid' }
      ]);
    }

    const query = CategoryModel.findById(id);
    if (options.populate) {
      query.populate('children').populate('parent');
    }

    const category = await query.exec();
    if (!category) {
      throw AppError.NotFound('Category not found', [
        { field: 'id', message: 'No category exists with this ID' }
      ]);
    }

    return category;
  }

  static async findAll(options: FindAllOptions = {}): Promise<{
    categories: CategoryDocument[];
    total: number;
    filteredTotal: number;
  }> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = 'order',
      search,
      status,
      parentId,
      select
    } = options;

    const query: FilterQuery<CategoryDocument> = { ...filter };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'meta.title': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (parentId) query.parentId = parentId === 'null' ? null : parentId;

    try {
      const [total, filteredTotal, categories] = await Promise.all([
        CategoryModel.countDocuments({}),
        CategoryModel.countDocuments(query),
        CategoryModel.find(query)
          .select(select || '')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .exec()
      ]);

      return { categories, total, filteredTotal };
    } catch (error) {
      throw AppError.DatabaseError('Error fetching categories');
    }
  }

  static async update(
    id: string,
    updateData: UpdateQuery<CategoryDocument>,
    userId: string,
    options: UpdateOptions = {}
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format');
    }

    try {
      const category = await CategoryModel.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        {
          new: true,
          runValidators: options.validateBeforeUpdate ?? true,
          ...(options.select && { select: options.select })
        }
      );

      if (!category) {
        throw AppError.NotFound('Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.DatabaseError('Error updating category');
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format');
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
      throw AppError.NotFound('Category not found');
    }

    // Check if category has children
    const hasChildren = await CategoryModel.exists({ parentId: id });
    if (hasChildren) {
      throw AppError.BadRequest('Cannot delete category with subcategories', [
        { field: 'id', message: 'Please delete or move subcategories first' }
      ]);
    }

    // Check if category has associated products
    if (category.productCount > 0) {
      throw AppError.BadRequest('Cannot delete category with products', [
        { field: 'id', message: 'Please remove or reassign products first' }
      ]);
    }

    await category.deleteOne();

    // Update parent's isLeaf status if needed
    if (category.parentId) {
      const siblingsExist = await CategoryModel.exists({ parentId: category.parentId });
      if (!siblingsExist) {
        await CategoryModel.findByIdAndUpdate(category.parentId, {
          isLeaf: true
        });
      }
    }

    return true;
  }

  static async reorderCategories(
    parentId: string | null,
    orderedIds: string[]
  ): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        CategoryModel.findByIdAndUpdate(id, {
          order: index,
          parentId: parentId
        })
      )
    );
  }
}