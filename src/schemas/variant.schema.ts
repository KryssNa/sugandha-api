// schemas/variant.schema.ts
import { z } from 'zod';

export const createVariantSchema = z.object({
  body: z.object({
    size: z.number()
      .min(1, 'Size must be greater than 0')
      .max(1000, 'Size cannot exceed 1000 ml'),
    sku: z.string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'SKU must be alphanumeric with hyphens'),
    price: z.number()
      .min(0.01, 'Price must be greater than 0'),
    originalPrice: z.number()
      .min(0.01, 'Original price must be greater than 0'),
    quantity: z.number()
      .int('Quantity must be an integer')
      .min(0, 'Quantity cannot be negative')
  }).refine(data => data.originalPrice >= data.price, {
    message: 'Original price cannot be less than sale price',
    path: ['originalPrice']
  })
});

export const updateVariantSchema = createVariantSchema.partial();

export const bulkStockUpdateSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      sku: z.string(),
      quantity: z.number().int()
    }))
  })
});

export type CreateVariantBody = z.infer<typeof createVariantSchema>['body'];
export type UpdateVariantBody = z.infer<typeof updateVariantSchema>['body'];
export type BulkStockUpdateBody = z.infer<typeof bulkStockUpdateSchema>['body'];