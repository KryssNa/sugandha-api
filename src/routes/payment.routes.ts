// routes/payment.routes.ts
import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { initiatePaymentSchema, verifyPaymentSchema } from '../schemas/payment.schema';


const router = Router();

router.use(authenticate);

router.post(
    '/initiate',
    validateRequest(initiatePaymentSchema),
    PaymentController.initiatePayment
);

router.post(
    '/verify',
    validateRequest(verifyPaymentSchema),
    PaymentController.verifyPayment
);

export default router;