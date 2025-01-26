import axios from "axios";
import { configDotenv } from "dotenv";
import { OrderModel } from "../../models/order.model";
import { PaymentModel } from "../../models/payment.model";

configDotenv();
// services/payment/esewa.service.ts
const crypto = require("crypto");


interface FormData {
  amount: number;
  tax_amount: number;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

interface VerificationData {
  merchantCode: string;
  transactionId: string;
  amount: number;
}

function generateSignature(data: string, secretKey: string): string {
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(data);
  return hmac.digest("base64");
}
export class EsewaPaymentService {

  static async initiatePayment(
    orderId: string,
    amount: number,
    userId: string
  ) {
    const transactionUuid = `ORDER_${orderId}_${userId}_${Date.now()}`;

    // Generate esewa payment URL and form data
    const totalAmount = amount;
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const dataToSign = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${process.env.ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(dataToSign, process.env.ESEWA_SECRET_KEY ?? "");

    const formData = {
      amount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: process.env.ESEWA_MERCHANT_ID,
      success_url: `${process.env.FRONTEND_URL}/checkout/payment/esewa/success`,
      failure_url: `${process.env.FRONTEND_URL}/checkout/payment/esewa/failure`,
      signed_field_names: signedFieldNames,
      signature
    };

    // Create pending payment record
    const payment = await PaymentModel.create({
      orderId,
      userId,
      amount: totalAmount,
      method: {
        type: 'esewa',
        details: {
          transactionId: transactionUuid,
          merchantCode: process.env.ESEWA_MERCHANT_ID
        }
      },
      status: 'pending'
    });

    return {
      paymentUrl: process.env.ESEWA_URL,
      formData,
      payment
    };
  }
  static async verifyPayment(verificationData: any) {
    try {
      // Debug log
      let decodedData, transaction_uuid, product_code, total_amount;
      if (verificationData) {
        decodedData = JSON.parse(
          Buffer.from(verificationData, "base64").toString("utf-8"),
        );
        ({ transaction_uuid, product_code, total_amount } = decodedData);
      } else {
        ({ transaction_uuid, product_code, total_amount } = verificationData);
      }

      const verifyResponse = await axios.get('https://rc-epay.esewa.com.np/api/epay/transaction/status', {
        params: {
          product_code:product_code || 'EPAYTEST',
          transaction_uuid: transaction_uuid || 'ORDER_123456789',
          total_amount: total_amount || 100,
          signed_field_names: 'total_amount,transaction_uuid,product_code'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('eSewa response:', verifyResponse.data);

      if (verifyResponse.data.status === 'COMPLETE') {
        const payment = await PaymentModel.findOneAndUpdate(
          { 'method.details.transactionId': verificationData.transactionId },
          {
            status: 'completed',
            'method.details.refId': verifyResponse.data.ref_id
          },
          { new: true }
        );

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

    } catch (error: any) {
      console.error('Esewa verification error:', error?.response?.data || error);
      return {
        success: false,
        error: error?.response?.data?.detail || 'Payment verification failed'
      };
    }
  }
}
