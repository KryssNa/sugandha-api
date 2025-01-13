import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number()
      .min(1, 'Quantity must be at least 1')
      .max(10, 'Maximum quantity allowed is 10')
  })
});

export const updateQuantitySchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number()
      .min(0, 'Quantity cannot be negative')
      .max(10, 'Maximum quantity allowed is 10')
  })
});

export const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string()
      .min(3, 'Invalid coupon code')
      .max(20, 'Invalid coupon code')
  })
});


export const bulkUpdateSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number()
        .min(0, 'Quantity cannot be negative')
        .max(10, 'Maximum quantity allowed is 10')
    }))
    .min(1, 'At least one update is required')
    .max(20, 'Too many updates')
  })
});