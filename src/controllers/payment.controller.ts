// controllers/payment.controller.ts
import { Request, Response } from 'express';
import { EsewaPaymentService } from '../services/payment/esewa.service';
import { KhaltiPaymentService } from '../services/payment/khalti.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class PaymentController {
    static initiatePayment = asyncHandler(async (req: Request, res: Response) => {
        const { orderId, amount, paymentMethod } = req.body;
        const userId = req.user!.id;

        let paymentData;

        switch (paymentMethod) {
            case 'esewa':
                paymentData = await EsewaPaymentService.initiatePayment(orderId, amount, userId);
                break;
            case 'khalti':
                paymentData = await KhaltiPaymentService.initiatePayment(orderId, amount, userId);
                break;
            case 'cod':
                // Handle COD logic
                break;
            default:
                throw AppError.BadRequest('Invalid payment method');
        }

        ApiResponse.success(res, {
            statusCode: 200,
            message: 'Payment initiated successfully',
            data: paymentData
        });
    });

    static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
        const { method, pid, status } = req.body;

        if (status === 'failure') {
            throw AppError.BadRequest('Payment failed');
        }

        let verificationResult;

        switch (method) {
            case 'esewa':
                verificationResult = await EsewaPaymentService.verifyPayment(pid);
                break;
            case 'khalti':
                verificationResult = await KhaltiPaymentService.verifyPayment(pid);
                break;
            default:
                throw AppError.BadRequest('Invalid payment method');
        }

        if (!verificationResult.success) {
            throw AppError.BadRequest(verificationResult.error || 'Payment verification failed');
        }

        ApiResponse.success(res, {
            statusCode: 200,
            message: 'Payment verified successfully',
            data: verificationResult
        });
    });
}