import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
    checkoutSchema,
    paymentRetrySchema
} from '../schemas/checkout.schema';
import { optionalAuthenticate } from '../middlewares/optionalAuth';
import { activityLogger } from '../middlewares/activityLogger';

const router = Router();

// Checkout route (supports both guest and authenticated users)
router.post(
    '/',
    optionalAuthenticate,
    validateRequest(checkoutSchema),
    activityLogger,
    CheckoutController.processCheckout
);

// Payment retry (requires authentication)
router.post(
    '/retry-payment/:orderId',
    authenticate,
    activityLogger,
    validateRequest(paymentRetrySchema),
    CheckoutController.retryPayment
);

// Get order details
router.get(
    '/orders/:orderId',
    optionalAuthenticate,
    activityLogger,
    CheckoutController.getOrderDetails
);

// Get user's orders
router.get(
    '/orders',
    authenticate,
    activityLogger,
    CheckoutController.getUserOrders
);
export default router;