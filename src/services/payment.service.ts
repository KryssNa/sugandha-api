import { PaymentModel } from '../models/payment.model';
import { OrderModel } from '../models/order.model';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

export class PaymentService {
  static async processPayment(
    orderId: string, 
    userId: string, 
    paymentData: any
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the order
      const order = await OrderModel.findById(orderId).session(session);
      
      if (!order) {
        throw AppError.NotFound('Order not found');
      }

      // Create payment record
      const payment = await PaymentModel.create([{
        orderId: order._id,
        userId,
        amount: order.totalAmount,
        method: {
          type: paymentData.method,
          details: paymentData.details
        },
        status: 'pending'
      }], { session });

      // Update order with payment reference
      await OrderModel.findByIdAndUpdate(
        orderId, 
        { 
          payment: payment[0]._id,
          status: 'processing' 
        },
        { session }
      );

      // Integrate with payment gateway (placeholder)
      const paymentResult = await this.validatePayment(paymentData);

      // Update payment status
      await PaymentModel.findByIdAndUpdate(
        payment[0]._id,
        { 
          status: paymentResult.success ? 'completed' : 'failed',
          transactionReference: paymentResult.transactionId
        },
        { session }
      );

      // Update order status
      await OrderModel.findByIdAndUpdate(
        orderId, 
        { 
          status: paymentResult.success ? 'paid' : 'pending' 
        },
        { session }
      );

      await session.commitTransaction();

      return {
        order,
        payment: payment[0],
        success: paymentResult.success
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Simulate payment gateway validation
  private static async validatePayment(paymentData: any) {
    // In a real-world scenario, this would integrate with actual payment gateways
    switch (paymentData.method) {
      case 'credit-card':
        return this.validateCreditCardPayment(paymentData.details);
      case 'khalti':
        return this.validateDigitalWalletPayment(paymentData.details, 'khalti');
      case 'esewa':
        return this.validateDigitalWalletPayment(paymentData.details, 'esewa');
      case 'cash-on-delivery':
        return { success: true, transactionId: `COD-${Date.now()}` };
      default:
        throw AppError.BadRequest('Invalid payment method');
    }
  }

  private static async validateCreditCardPayment(cardDetails: any) {
    // Basic validation (replace with actual payment gateway integration)
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (
      !cardDetails.cardNumber || 
      !cardDetails.expiryMonth || 
      !cardDetails.expiryYear ||
      cardDetails.expiryYear < currentYear ||
      (cardDetails.expiryYear === currentYear && cardDetails.expiryMonth < currentMonth)
    ) {
      return { success: false };
    }

    return { 
      success: true, 
      transactionId: `CC-${Date.now()}` 
    };
  }

  private static async validateDigitalWalletPayment(details: any, method: string) {
    // Basic validation for digital wallets
    if (!details.phoneNumber && !details.email) {
      return { success: false };
    }

    return { 
      success: true, 
      transactionId: `${method.toUpperCase()}-${Date.now()}` 
    };
  }
}