// src/schemas/product.schema.ts
import { z } from 'zod';

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string({required_error:'Invalid image URL'}),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false)
});

const variantSchema = z.object({
  size: z.number().min(1, 'Size must be greater than 0'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  originalPrice: z.number().min(0, 'Original price must be greater than or equal to 0'),
  quantity: z.number().min(0, 'Quantity must be greater than or equal to 0'),
  inStock: z.boolean().default(true)
});

const scentNoteSchema = z.object({
  type: z.enum(['top', 'middle', 'base']),
  notes: z.array(z.string()).min(1, 'At least one note is required')
});

const specificationSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required')
});

const ratingSchema = z.object({
  average: z.number().min(0).max(5).default(0),
  count: z.number().min(0).default(0),
  distribution: z.object({
    1: z.number().min(0).default(0),
    2: z.number().min(0).default(0),
    3: z.number().min(0).default(0),
    4: z.number().min(0).default(0),
    5: z.number().min(0).default(0)
  })
});

const reviewSchema = z.object({
  userId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required'),
  title: z.string().optional(),
  verifiedPurchase: z.boolean().default(false),
  helpful: z.number().min(0).default(0)
});

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    brand: z.string().min(1, 'Brand is required'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional(),

    images: z.array(imageSchema).min(1, 'At least one image is required'),
    thumbnail: z.string({required_error:'Invalid thumbnail URL'}),
    coverImage: z.string({required_error:'Invalid cover image URL'}),
    video: z.string().optional(),

    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
    basePrice: z.number().min(0),
    originalPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    discountEndDate: z.string().datetime().optional(),
    quantity: z.number().min(0),

    category: z.array(z.string()).min(1, 'At least one category is required'),
    subCategory: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    collections: z.array(z.string()).optional(),
    gender: z.enum(['male', 'female', 'unisex']),

    concentration: z.enum(['Parfum', 'EDP', 'EDT', 'EDC']),
    scentNotes: z.array(scentNoteSchema).min(1, 'At least one scent note is required'),
    sillage: z.enum(['Intimate', 'Moderate', 'Strong', 'Enormous']).optional(),
    longevity: z.enum(['Poor', 'Moderate', 'Long Lasting', 'Very Long Lasting']).optional(),
    seasonality: z.array(z.string()).optional(),
    timeOfDay: z.array(z.string()).optional(),
    occasions: z.array(z.string()).optional(),

    specifications: z.array(specificationSchema).optional(),
    features: z.array(z.string()).optional(),
    ingredients: z.array(z.string()).optional(),
    madeIn: z.string().min(1, 'Country of origin is required'),
    launchYear: z.number().optional(),
    perfumer: z.string().optional(),

    isHot: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isLimited: z.boolean().default(false),

    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional()
  })
});

export const updateProductSchema = createProductSchema.deepPartial();

export const addReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, 'Comment is required'),
    title: z.string().optional()
  })
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    gender: z.enum(['male', 'female', 'unisex']).optional(),
    concentration: z.enum(['Parfum', 'EDP', 'EDT', 'EDC']).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    tags: z.string().optional(),
    isHot: z.string().optional(),
    isFeatured: z.string().optional(),
    isNewArrival: z.string().optional(),
    isBestSeller: z.string().optional(),
    isLimited: z.string().optional()
  })
});