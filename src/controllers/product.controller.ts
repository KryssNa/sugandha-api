// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class ProductController {
  // Create new product
  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', [
        { message: 'You do not have permission to create products' }
      ]);
    }

    const product = await ProductService.create(req.body);

    ApiResponse.success(res, {
      statusCode: 201,
      message: 'Product created successfully',
      data: { product }
    });
  });

  // Get all products with filtering
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sortBy as string;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const gender = req.query.gender as string;
    const concentration = req.query.concentration as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

    const { products, total, filteredTotal } = await ProductService.findAll({
      page,
      limit,
      sort,
      search,
      category,
      brand,
      gender,
      concentration,
      minPrice,
      maxPrice,
      tags
    });

    ApiResponse.success(res, {
      message: 'Products retrieved successfully',
      data: { products },
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

  // Get product by ID
  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.findById(req.params.id);

    ApiResponse.success(res, {
      message: 'Product retrieved successfully',
      data: { product }
    });
  });

  // Get product by slug
  static getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.findBySlug(req.params.slug);

    ApiResponse.success(res, {
      message: 'Product retrieved successfully',
      data: { product }
    });
  });

  // Update product
  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', [
        { message: 'You do not have permission to update products' }
      ]);
    }

    const product = await ProductService.update(req.params.id, req.body);

    ApiResponse.success(res, {
      message: 'Product updated successfully',
      data: { product }
    });
  });

  // Delete product
  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !['admin'].includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', [
        { message: 'You do not have permission to delete products' }
      ]);
    }

    await ProductService.delete(req.params.id);

    ApiResponse.success(res, {
        data: null,
      message: 'Product deleted successfully'
    });
  });

  // Add review
  static addReview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required', [
        { message: 'You must be logged in to review products' }
      ]);
    }

    const { rating, comment, title } = req.body;
    const product = await ProductService.addReview(
      req.params.id,
      req.user._id,
      rating,
      comment,
      title
    );

    ApiResponse.success(res, {
      message: 'Review added successfully',
      data: { product }
    });
  });

  // Update inventory
  static updateStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', [
        { message: 'You do not have permission to update inventory' }
      ]);
    }

    const { quantity } = req.body;
    await ProductService.updateStock(req.params.id, quantity);

    ApiResponse.success(res, {
        data: null,
      message: 'Stock updated successfully'
    });
  });

  // Update variant stock
  static updateVariantStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', [
        { message: 'You do not have permission to update inventory' }
      ]);
    }

    const { variantSku, quantity } = req.body;
    const product = await ProductService.updateVariantStock(
      req.params.id,
      variantSku,
      quantity
    );

    ApiResponse.success(res, {
      message: 'Variant stock updated successfully',
      data: { product }
    });
  });

  // Get featured products
  static getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { products, total } = await ProductService.findAll({
      filter: { isFeatured: true },
      limit: 10
    });

    ApiResponse.success(res, {
      message: 'Featured products retrieved successfully',
      data: { products },
      metadata: { total }
    });
  });

  // Get new arrivals
  static getNewArrivals = asyncHandler(async (req: Request, res: Response) => {
    const { products, total } = await ProductService.findAll({
      filter: { isNewArrival: true },
      sort: '-createdAt',
      limit: 10
    });

    ApiResponse.success(res, {
      message: 'New arrivals retrieved successfully',
      data: { products },
      metadata: { total }
    });
  });

  // Get best sellers
  static getBestSellers = asyncHandler(async (req: Request, res: Response) => {
    const { products, total } = await ProductService.findAll({
      filter: { isBestSeller: true },
      limit: 10
    });

    ApiResponse.success(res, {
      message: 'Best sellers retrieved successfully',
      data: { products },
      metadata: { total }
    });
  });

  // Get related products
  static getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.findById(req.params.id);
    const { products } = await ProductService.findAll({
      filter: {
        category: { $in: product.category },
        _id: { $ne: product._id }
      },
      limit: 4
    });

    ApiResponse.success(res, {
      message: 'Related products retrieved successfully',
      data: { products }
    });
  });
}