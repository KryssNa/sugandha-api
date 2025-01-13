// models/contact.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export enum ContactType {
  GENERAL = 'general',
  QUOTATION = 'quotation', 
  SUPPORT = 'support',
  PARTNERSHIP = 'partnership'
}

export interface IAttachment {
  filename: string;
  path: string;
  mimetype: string;
}

export interface ContactDocument extends Document {
  type: ContactType;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  position?: string;
  subject?: string;
  message: string;
  productDetails?: string;
  quantity?: number;
  orderNumber?: string;
  issueType?: string;
  partnershipType?: string;
  attachments?: IAttachment[];
  status: 'pending' | 'inProgress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<ContactDocument>(
  {
    type: {
      type: String,
      enum: Object.values(ContactType),
      required: [true, 'Contact type is required']
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    companyName: {
      type: String,
      trim: true
    },
    position: String,
    subject: String,
    message: {
      type: String,
    //   required: [true, 'Message is required']
    },
    productDetails: String,
    quantity: Number,
    orderNumber: String,
    issueType: String,
    partnershipType: String,
    attachments: [{
      filename: String,
      path: String,
      mimetype: String
    }],
    status: {
      type: String,
      enum: ['pending', 'inProgress', 'resolved', 'closed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  {
    timestamps: true,
  }
);

// Indexes
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ type: 1 });

export const ContactModel = mongoose.model<ContactDocument>('Contact', contactSchema);