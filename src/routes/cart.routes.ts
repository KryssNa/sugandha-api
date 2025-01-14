import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

import {
  addToCartSchema,
  applyCouponSchema,
  updateQuantitySchema,
} from '../schemas/cart.schema';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(authenticate); // Require authentication for all cart routes

router.get('/', CartController.getCart);

router.post(
  '/add',
  validateRequest(addToCartSchema),
  CartController.addToCart
);

router.patch(
  '/quantity',
  validateRequest(updateQuantitySchema),
  CartController.updateQuantity
);

router.delete(
  '/:productId',
  CartController.removeFromCart
);

router.post(
  '/coupon',
  validateRequest(applyCouponSchema),
  CartController.applyCoupon
);

router.delete('/clear',

  CartController.clearCart);

export default router;
