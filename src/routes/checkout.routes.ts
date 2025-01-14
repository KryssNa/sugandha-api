import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
    checkoutSchema,
    paymentRetrySchema
} from '../schemas/checkout.schema';
import { optionalAuthenticate } from '../middlewares/optionalAuth';

const router = Router();

// Checkout route (supports both guest and authenticated users)
router.post(
    '/',
    optionalAuthenticate,
    validateRequest(checkoutSchema),
    CheckoutController.processCheckout
);

// Payment retry (requires authentication)
router.post(
    '/retry-payment/:orderId',
    authenticate,
    validateRequest(paymentRetrySchema),
    CheckoutController.retryPayment
);

// Get order details
router.get(
    '/orders/:orderId',
    optionalAuthenticate,
    CheckoutController.getOrderDetails
);

// Get user's orders
router.get(
    '/orders',
    authenticate,
    CheckoutController.getUserOrders
);
export default router;