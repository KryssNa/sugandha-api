import mongoose, { Document, Schema } from 'mongoose';

export interface PaymentFailureDocument extends Document {
  order: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  paymentMethod: string;
  amount: number;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  additionalDetails: {
    paymentMethod: string;
    maskedPaymentDetails: any;
  };
  resolvedAt?: Date;
  resolutionStatus?: 'pending' | 'resolved' | 'cancelled';
}

const paymentFailureSchema = new Schema<PaymentFailureDocument>({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  errorType: {
    type: String,
    required: true
  },
  errorMessage: {
    type: String,
    required: true
  },
  errorStack: String,
  additionalDetails: {
    type: Schema.Types.Mixed,
    required: true
  },
  resolvedAt: Date,
  resolutionStatus: {
    type: String,
    enum: ['pending', 'resolved', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export const PaymentFailureModel = mongoose.model<PaymentFailureDocument>(
  'PaymentFailure', 
  paymentFailureSchema
);