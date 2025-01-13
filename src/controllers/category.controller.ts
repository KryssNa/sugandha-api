// controllers/category.controller.ts
import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { CategoryService } from '../services/category.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class CategoryController {
    static createCategory = asyncHandler(async (req: Request, res: Response) => {
        const category = await CategoryService.create(req.body, req.user!._id);

        ApiResponse.success(res, {
            statusCode: 201,
            message: 'Category created successfully',
            data: category
        });
    });

    static getCategories = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const { sort, search, status, parentId } = req.query;

        const { categories, total, filteredTotal } = await CategoryService.findAll({
            page,
            limit,
            sort: sort as string,
            search: search as string,
            status: status as string,
            parentId: parentId as string
        });

        ApiResponse.success(res, {
            data: categories,
            message: 'Categories retrieved successfully',
            metadata: {
                page,
                limit,
                total,
                filteredTotal,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < filteredTotal,
                hasPrevPage: page > 1
            }
        });
    });

    static getCategoryById = asyncHandler(async (req: Request, res: Response) => {
        const category = await CategoryService.findById(req.params.id, { populate: true });

        ApiResponse.success(res, {
            data: category,
            message: 'Category retrieved successfully'
        });
    });

    static updateCategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const category = await CategoryService.update(id, req.body, req.user!._id);

        ApiResponse.success(res, {
            data: category,
            message: 'Category updated successfully'
        });
    });

    static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await CategoryService.delete(id);

        ApiResponse.success(res, {
            message: 'Category deleted successfully'
        });
    });

    static getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;

        const category = await CategoryModel.findOne({ slug })
            .populate('children')
            .populate('parent');

        if (!category) {
            throw AppError.NotFound('Category not found');
        }

        ApiResponse.success(res, {
            data: category,
            message: 'Category retrieved successfully'
        });
    });

    static getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
        // Get all categories
        const categories = await CategoryModel.find()
            .sort('order')
            .lean();

        // Build tree structure
        const buildTree = (parentId: string | null = null): any[] => {
            return categories
                .filter(cat => String(cat.parentId) === String(parentId))
                .map(cat => ({
                    ...cat,
                    children: buildTree(String(cat._id))
                }));
        };

        const tree = buildTree();

        ApiResponse.success(res, {
            data: tree,
            message: 'Category tree retrieved successfully'
        });
    });

    static reorderCategories = asyncHandler(async (req: Request, res: Response) => {
        const { parentId, orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            throw AppError.BadRequest('Ordered IDs must be an array');
        }

        await CategoryService.reorderCategories(parentId, orderedIds);

        ApiResponse.success(res, {
            message: 'Categories reordered successfully'
        });
    });

    static updateCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            throw AppError.BadRequest('Invalid status value');
        }

        const category = await CategoryService.update(id, { status }, req.user!._id);

        ApiResponse.success(res, {
            data: category,
            message: 'Category status updated successfully'
        });
    });
}