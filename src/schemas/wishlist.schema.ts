// schemas/wishlist.schema.ts
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

export const addToWishlistSchema = z.object({
    body: z.object({
        productId: z.string().min(1, 'Product ID is required')
    })
});