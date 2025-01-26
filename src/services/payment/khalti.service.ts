import axios from "axios";
import { PaymentModel } from "../../models/payment.model";
import { OrderModel } from "../../models/order.model";

 
  // services/payment/khalti.service.ts
  export class KhaltiPaymentService {
    static async initiatePayment(
      orderId: string,
      amount: number,
      userId: string
    ) {
      const transactionUuid = `ORDER_${orderId}_${userId}_${Date.now()}`;
  
      const payload = {
        merchant_id: process.env.KHALTI_MERCHANT_ID,
        amount: amount * 100, // Convert to paisa
        return_url: `${process.env.FRONTEND_URL}/checkout/payment/khalti/success`,
        website_url: process.env.FRONTEND_URL,
        purchase_order_id: transactionUuid
      };
  
      // Initiate Khalti payment
      const response = await axios.post(
        process.env.KHALTI_URL ?? '',
        payload,
        {
          headers: { 
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` 
          }
        }
      );
  
      // Create pending payment record
      const payment = await PaymentModel.create({
        orderId,
        userId,
        amount,
        method: {
          type: 'khalti',
          details: {
            transactionId: transactionUuid,
            pidx: response.data.pidx
          }
        },
        status: 'pending'
      });
  
      return {
        paymentUrl: response.data.payment_url,
        payment
      };
    }
  
    static async verifyPayment(pidx: string) {
      try {
        // Verify with Khalti API  
        const verifyResponse = await axios.post(
          process.env.KHALTI_VERIFY_URL ?? '',
          { pidx },
          {
            headers: {
              Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`
            }
          }
        );
  
        if (verifyResponse.data.status === 'Completed') {
          // Update payment status
          const payment = await PaymentModel.findOneAndUpdate(
            { 'method.details.pidx': pidx },
            {
              status: 'completed',
              'method.details.transactionId': verifyResponse.data.transaction_id
            },
            { new: true }  
          );
  
          // Update order status
          await OrderModel.findByIdAndUpdate(
            payment?.orderId,
            { status: 'paid' }
          );
  
          return {
            success: true,
            payment
          };
        }
  
        return {
          success: false,
          error: 'Payment verification failed'
        };
  
      } catch (error) {
        console.error('Khalti verification error:', error);
        return {
          success: false,
          error: 'Payment verification failed'
        };
      }
    }
  }