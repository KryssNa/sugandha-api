import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { addToWishlistSchema } from '../schemas/wishlist.schema';

const router = Router();

router.use(authenticate); // Require authentication for all wishlist routes

router.get('/', WishlistController.getWishlist);

router.post(
    '/add',
    validateRequest(addToWishlistSchema),
    WishlistController.addToWishlist
);

router.delete(
    '/:productId',
    WishlistController.removeFromWishlist
);

router.post(
    '/:productId/move-to-cart',
    WishlistController.moveToCart
);

router.delete('/clear', WishlistController.clearWishlist);

router.get(
    '/:productId/check',
    WishlistController.checkProduct
);

export default router;

