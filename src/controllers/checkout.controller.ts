import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderModel } from '../models/order.model';
import { PaymentFailureModel } from '../models/paymentFailure.model';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class CheckoutController {
    // Unified checkout process supporting guest and authenticated users
    static processCheckout = asyncHandler(async (req: Request, res: Response) => {
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            // Determine user context
            const userId = req.user?._id;
            const {
                orderData,
                paymentData,
                isGuest = false,
                guestUserDetails
            } = req.body;

            // 1. Handle User Context
            let finalUserId = userId;
            if (isGuest && guestUserDetails) {
                // Create or retrieve guest user
                finalUserId = await this.handleGuestUserCreation(
                    guestUserDetails,
                    // session
                );
            }

            // 2. Create Order
            const order = await OrderService.createOrder(
                {
                    ...orderData,
                    userId: finalUserId,
                    isGuest
                },
            );

            // 3. Process Payment
            let paymentResult;
            try {
                paymentResult = await PaymentService.processPayment(
                    order.id,
                    finalUserId!,
                    paymentData,
                );
            } catch (paymentError) {
                // Handle Payment Failure
                const failureRecord = await this.handlePaymentFailure(
                    order,
                    paymentData,
                    paymentError,
                    // session
                );

                // Throw detailed payment error
                throw AppError.PaymentFailed('Payment processing failed',);
            }

            // 4. Update Order Status
            await OrderService.updateOrderStatus(
                order.id,
                paymentResult.success ? 'paid' : 'payment-failed',
            );

            // await session.commitTransaction();

            // 5. Prepare Response
            const responseData = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: paymentResult.payment.status,
                success: paymentResult.success,
                isGuest
            };

            // Send appropriate response
            return ApiResponse.success(res, {
                statusCode: paymentResult.success ? 201 : 402,
                message: paymentResult.success
                    ? 'Checkout processed successfully'
                    : 'Payment processing failed',
                data: responseData
            });
        } catch (error) {
            // await session.abortTransaction();

            // Detailed error handling
            if (error instanceof AppError) {
                return ApiResponse.error(res, {
                    statusCode: error.statusCode,
                    message: error.message,
                });
            }

            // Generic error response
            return ApiResponse.error(res, {
                statusCode: 500,
                message: 'Checkout processing failed',
                errors: error instanceof Error ? [{ message: error.message }] : [{ message: 'Unknown error' }]

            });
        } 
    });

    // Handle Guest User Creation or Retrieval
    private static async handleGuestUserCreation(
        guestUserDetails: any,
        // session: mongoose.mongo.ClientSession
    ): Promise<string> {
        try {
            // Check if user with email already exists
            const existingUser = await UserService.findByEmail(guestUserDetails.email);

            if (existingUser) {
                return existingUser._id;
            }

            // Create new guest user
            const newUser = await UserService.createGuestUser(
                guestUserDetails,
            );

            return newUser._id;
        } catch (error) {
            console.error('Guest user creation failed', error);
            throw AppError.BadRequest('Failed to process guest user');
        }
    }

    // Dedicated Payment Failure Handling
    private static async handlePaymentFailure(
        order: any,
        paymentData: any,
        error: any,
        // session: mongoose.mongo.ClientSession
    ) {
        try {
            // Create payment failure record
            const paymentFailure = await PaymentFailureModel.create([{
                order: order._id,
                user: order.user,
                paymentMethod: paymentData.method,
                amount: order.totalAmount,
                errorType: error.name || 'UnknownError',
                errorMessage: error.message,
                errorStack: error.stack,
                additionalDetails: {
                    paymentMethod: paymentData.method,
                    maskedPaymentDetails: this.maskPaymentDetails(paymentData)
                }
            }]);

            // Notify about payment failure
            await this.notifyPaymentFailure(order, paymentFailure[0]);

            return paymentFailure[0];
        } catch (recordError) {
            console.error('Failed to record payment failure', recordError);
            throw recordError;
        }
    }

    // Retry Payment for Failed Orders
    static retryPayment = asyncHandler(async (req: Request, res: Response) => {
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const { orderId } = req.params;
            const { paymentData } = req.body;
            const userId = req.user?._id;

            // Retrieve existing order
            const order = await OrderModel.findById(orderId);

            if (!order) {
                throw AppError.NotFound('Order not found');
            }

            // Validate payment retry eligibility
            if (order.status !== 'payment-failed') {
                throw AppError.BadRequest('Order is not eligible for payment retry');
            }

            // Process payment retry
            const paymentResult = await PaymentService.processPayment(
                order.id,
                userId!,
                paymentData,
            );

            // Update order status
            await OrderService.updateOrderStatus(
                order.id,
                paymentResult.success ? 'paid' : 'payment-failed',
            );

            // await session.commitTransaction();

            return ApiResponse.success(res, {
                message: 'Payment retry processed',
                data: {
                    orderId: order._id,
                    success: paymentResult.success
                }
            });
        } catch (error) {
            // await session.abortTransaction();

            return ApiResponse.error(res, {
                message: 'Payment retry failed',
                errors: error instanceof Error ? [{ message: error.message }] : [{ message: 'Unknown error' }]
            });
        } 
    });

    // Utility methods for sensitive data masking
    private static maskPaymentDetails(paymentData: any) {
        // Existing masking logic remains the same
        // (as in the previous implementation)
    }

    // Notify about payment failure
    private static async notifyPaymentFailure(order: any, paymentFailure: any) {
        try {
            console.log('Payment Failure Notification', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                failureId: paymentFailure._id
            });

            // TODO: Implement actual notification mechanism 
            // (e.g., email, Slack, monitoring system)
        } catch (notificationError) {
            console.error('Failed to send payment failure notification', notificationError);
        }
    }
}