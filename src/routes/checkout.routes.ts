import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
    checkoutSchema,
    paymentRetrySchema
} from '../schemas/checkout.schema';

const router = Router();

// Checkout route (supports both guest and authenticated users)
router.post(
    '/',
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

export default router;