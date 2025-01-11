// controllers/variant.controller.ts
import { Request, Response } from 'express';
import { VariantService } from '../services/variant.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class VariantController {
    static createVariant = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;
        const variant = await VariantService.create(productId, req.body);
        console.log('variant', variant);
        ApiResponse.success(res, {
            statusCode: 201,
            message: 'Variant created successfully',
            data: variant
        });
    });

    static getProductVariants = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;
        const variants = await VariantService.findByProductId(productId);

        ApiResponse.success(res, {
            message: 'Variants retrieved successfully',
            data: variants
        });
    });

    static updateVariant = asyncHandler(async (req: Request, res: Response) => {
        const { productId, sku } = req.params;
        const variant = await VariantService.update(productId, sku, req.body);

        ApiResponse.success(res, {
            message: 'Variant updated successfully',
            data: variant
        });
    });

    static deleteVariant = asyncHandler(async (req: Request, res: Response) => {
        const { productId, sku } = req.params;
        await VariantService.delete(productId, sku);

        ApiResponse.success(res, {
            message: 'Variant deleted successfully'
        });
    });

    static updateStock = asyncHandler(async (req: Request, res: Response) => {
        const { productId, sku } = req.params;
        const { quantity } = req.body;
        const variant = await VariantService.updateStock(productId, sku, quantity);

        ApiResponse.success(res, {
            message: 'Stock updated successfully',
            data: variant
        });
    });

    static bulkStockUpdate = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;
        const { updates } = req.body;
        const variants = await VariantService.bulkStockUpdate(productId, updates);

        ApiResponse.success(res, {
            message: 'Stock updated successfully',
            data: variants
        });
    });

    static reorderVariants = asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;
        const { order } = req.body;
        await VariantService.reorderVariants(productId, order);

        ApiResponse.success(res, {
            message: 'Variants reordered successfully'
        });
    });
}