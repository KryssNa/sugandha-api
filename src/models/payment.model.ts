import mongoose, { Document, Schema } from 'mongoose';

export interface PaymentMethod {
  type: 'credit-card' | 'khalti' | 'esewa' | 'cash-on-delivery';
  details?: CreditCardDetails | DigitalWalletDetails;
}

export interface CreditCardDetails {
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardType: 'visa' | 'mastercard' | 'american-express';
}

export interface DigitalWalletDetails {
  transactionId?: string;
  phoneNumber?: string;
  email?: string;
}

export interface PaymentDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionReference?: string;
}

const paymentSchema = new Schema<PaymentDocument>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  method: {
    type: {
      type: String,
      enum: ['credit-card', 'khalti', 'esewa', 'cash-on-delivery'],
      required: true
    },
    details: {
      type: Schema.Types.Mixed
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionReference: String
}, { 
  timestamps: true 
});

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', paymentSchema);