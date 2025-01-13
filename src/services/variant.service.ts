// services/variant.service.ts
import mongoose from 'mongoose';
import { VariantDocument, VariantModel } from '../models/variant.model';
import { AppError } from '../utils/AppError';

export class VariantService {
  static async create(
    productId: string,
    variantData: Partial<VariantDocument>
  ): Promise<VariantDocument> {
    const existingSku = await VariantModel.findOne({ sku: variantData.sku });
    if (existingSku) {
      throw AppError.Conflict('SKU already exists', [
        { field: 'sku', message: 'This SKU is already in use' }
      ]);
    }
    try {
      const variant = await VariantModel.create({
        ...variantData,
        productId,
        inStock: (variantData.quantity || 0) > 0
      });

      return variant;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }
      throw AppError.DatabaseError('Error creating variant');
    }
  }

  static async findByProductId(productId: string): Promise<VariantDocument[]> {
    return VariantModel.find({ productId }).sort('order');
  }

  static async update(
    productId: string,
    sku: string,
    updateData: Partial<VariantDocument>
  ): Promise<VariantDocument> {
    const variant = await VariantModel.findOneAndUpdate(
      { productId, sku },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!variant) {
      throw AppError.NotFound('Variant not found');
    }

    return variant;
  }

  static async delete(productId: string, sku: string): Promise<boolean> {
    const result = await VariantModel.findOneAndDelete({ productId, sku });

    if (!result) {
      throw AppError.NotFound('Variant not found');
    }

    return true;
  }

  static async updateStock(
    productId: string,
    sku: string,
    quantity: number
  ): Promise<VariantDocument> {
    const variant = await VariantModel.findOne({ productId, sku });

    if (!variant) {
      throw AppError.NotFound('Variant not found');
    }

    variant.quantity += quantity;
    variant.inStock = variant.quantity > 0;

    await variant.save();
    return variant;
  }

  static async bulkStockUpdate(
    productId: string,
    updates: Array<{ sku: string; quantity: number }>
  ): Promise<VariantDocument[]> {
    const updatedVariants = [];

    for (const update of updates) {
      const variant = await this.updateStock(productId, update.sku, update.quantity);
      updatedVariants.push(variant);
    }

    return updatedVariants;
  }

  static async reorderVariants(
    productId: string,
    orderedSkus: string[]
  ): Promise<void> {
    await Promise.all(
      orderedSkus.map((sku, index) =>
        VariantModel.findOneAndUpdate(
          { productId, sku },
          { order: index }
        )
      )
    );
  }
}