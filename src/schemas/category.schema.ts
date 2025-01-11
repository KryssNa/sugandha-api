// schemas/category.schema.ts
import { z } from 'zod';
import { CategoryStatus } from '../types/category.types';

// Base schemas for reuse
const metaSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  keywords: z.string().max(200).optional(),
});

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().max(100),
  key: z.string().optional(),
});

// Create Category Schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    description: z.string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    parentId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .optional(),
    meta: metaSchema.optional(),
    image: imageSchema.optional(),
  })
});

// Update Category Schema
export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    description: z.string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    parentId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .optional()
      .nullable(),
    status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE])
      .optional(),
    meta: metaSchema.partial().optional(),
    image: imageSchema.optional(),
    order: z.number().min(0).optional(),
  })
});

// Get Categories Query Schema
export const getCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    search: z.string().optional(),
    status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE]).optional(),
    parentId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .optional()
      .nullable(),
  })
});

// Reorder Categories Schema
export const reorderCategoriesSchema = z.object({
  body: z.object({
    parentId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .nullable(),
    orderedIds: z.array(
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    ).min(1, 'At least one category ID is required')
  })
});

// Update Category Status Schema
export const updateCategoryStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
  }),
  body: z.object({
    status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE])
  })
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body'];
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>['query'];
export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesSchema>['body'];