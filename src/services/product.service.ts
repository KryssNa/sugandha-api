// src/services/product.service.ts
import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';

import { IProduct } from '../types/product.types';
import { AppError } from '../utils/AppError';
import slugify from 'slugify';
import Product from '../models/poduct.model';

interface FindAllOptions {
  filter?: FilterQuery<IProduct>;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  concentration?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

export class ProductService {
  static async create(productData: Partial<IProduct>): Promise<IProduct> {
    try {
      // Generate slug from title
      const slug = slugify(productData.title!, { lower: true });
      
      // Generate SKU
      const sku = await this.generateSKU(productData.brand!);

      const product = await Product.create({
        ...productData,
        slug,
        sku
      });

      return product;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(409, 'Duplicate product', [
          { field: 'title', message: 'A product with this title already exists' }
        ]);
      }
      throw error;
    }
  }

  static async findById(id: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  }

  static async findBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug });
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  }

  static async findAll(options: FindAllOptions = {}): Promise<{
    products: IProduct[];
    total: number;
    filteredTotal: number;
  }> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search,
      category,
      brand,
      gender,
      concentration,
      minPrice,
      maxPrice,
      tags
    } = options;

    let query: FilterQuery<IProduct> = { ...filter };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = { $in: [category] };
    }

    // Brand filter
    if (brand) {
      query.brand = brand;
    }

    // Gender filter
    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    // Concentration filter
    if (concentration) {
      query.concentration = concentration;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = minPrice;
      if (maxPrice) query.basePrice.$lte = maxPrice;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    try {
      const total = await Product.countDocuments({});
      const filteredTotal = await Product.countDocuments(query);
      
      let sortOption = sort;
      if (sort === 'priceAsc') {
        sortOption = 'basePrice';
      } else if (sort === 'priceDsc') {
        sortOption = '-basePrice';
      }

      const products = await Product.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

      return { products, total, filteredTotal };
    } catch (error) {
      throw new AppError(500, 'Error fetching products');
    }
  }

  static async update(id: string, updateData: UpdateQuery<IProduct>): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    return product;
  }

  static async delete(id: string): Promise<void> {
    const result = await Product.findByIdAndDelete(id);
    if (!result) {
      throw new AppError(404, 'Product not found');
    }
  }

  static async addReview(
    productId: string,
    userId: string,
    rating: number,
    comment: string,
    title?: string
  ): Promise<IProduct> {
    const product = await this.findById(productId);

    // Check if user has already reviewed
    const existingReview = product.reviews.find(
      review => review.userId.toString() === userId
    );
    
    if (existingReview) {
      throw new AppError(400, 'Review already exists', [
        { message: 'You have already reviewed this product' }
      ]);
    }

    // Add new review
    product.reviews.push({
      userId: new mongoose.Types.ObjectId(userId),
      rating,
      comment,
      title,
      verifiedPurchase: false, // TODO: Check if user has purchased
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update rating stats
    const totalRatings = product.reviews.length;
    const ratingSum = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating.average = ratingSum / totalRatings;
    product.rating.count = totalRatings;
    product.rating.distribution[rating as keyof typeof product.rating.distribution]++;

    return product.save();
  }

  private static async generateSKU(brand: string): Promise<string> {
    const prefix = brand.substring(0, 3).toUpperCase();
    const count = await Product.countDocuments({ brand });
    const number = (count + 1).toString().padStart(5, '0');
    return `${prefix}${number}`;
  }

  // Additional methods for managing inventory
  static async updateStock(id: string, quantity: number): Promise<void> {
    const product = await this.findById(id);
    await product.updateStock(quantity);
  }

  static async updateVariantStock(
    id: string,
    variantSku: string,
    quantity: number
  ): Promise<IProduct> {
    const product = await this.findById(id);
    const variant = product.variants.find(v => v.sku === variantSku);

    if (!variant) {
      throw new AppError(404, 'Variant not found');
    }

    variant.quantity += quantity;
    variant.inStock = variant.quantity > 0;

    // Update overall product stock
    product.quantity = product.variants.reduce((sum, v) => sum + v.quantity, 0);
    product.inStock = product.quantity > 0;

    return product.save();
  }
}