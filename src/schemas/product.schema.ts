const { z } = require('zod');

const imageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
  isPrimary: z.boolean()
});

const variantSchema = z.object({
  size: z.number(),
  sku: z.string(),
  price: z.number(),
  originalPrice: z.number(),
  quantity: z.number(),
  inStock: z.boolean()
});

const categorySchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters')
  })
]);


const scentNoteSchema = z.object({
  type: z.enum(['top', 'middle', 'base']),
  notes: z.array(z.string())
});

const specificationSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    sku: z.string().min(1, 'SKU is required'),
    brand: z.string().min(1, 'Brand is required'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional(),

    images: z.array(imageSchema).min(1, 'At least one image is required'),
    thumbnail: z.string().min(1, 'Thumbnail is required'),
    coverImage: z.string().min(1, 'Cover image is required'),
    video: z.string().nullable().optional(),

    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
    basePrice: z.union([z.string(), z.number()]),
    originalPrice: z.union([z.string(), z.number()]),
    discount: z.number().min(0).max(100).default(0),
    discountEndDate: z.union([z.string(), z.date()]).optional(),
    quantity: z.number().min(0),
    inStock: z.boolean().default(true),

    category: z.array(categorySchema).min(1, 'At least one category is required'),

    subCategory: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    collections: z.array(z.string()).default([]),
    gender: z.enum(['male', 'female', 'unisex']),

    concentration: z.string().optional(),
    scentNotes: z.array(scentNoteSchema).min(1, 'At least one scent note is required'),
    sillage: z.string().optional(),
    longevity: z.string().optional(),
    //  z.enum(['Poor', 'Moderate', 'Long Lasting', 'Very Long Lasting']).optional(),
    seasonality: z.array(z.string()).default([]),
    timeOfDay: z.array(z.string()).default([]),
    occasions: z.array(z.string()).default([]),

    specifications: z.array(specificationSchema).default([]),
    features: z.array(z.string()).default([]),
    ingredients: z.array(z.string()).default([]),
    madeIn: z.string().min(1, 'Country of origin is required'),
    launchYear: z.union([z.string(), z.number()]).optional(),
    perfumer: z.string().optional(),

    isHot: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isLimited: z.boolean().default(false),

    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).default([]),

    // Optional fields that might be present in the data
    id: z.string().optional(),
    updateStock: z.function().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
  })
});
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
    sortBy: z.string().optional(),
    search: z.string().optional(),
    category: z.array(z.string()).optional(),
    brand: z.string().optional(),
    gender: z.enum(['male', 'female', 'unisex', "all"]).optional(),
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