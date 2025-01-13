import { z } from 'zod';
import { ContactType } from '../models/contact.model';

const attachmentSchema = z.object({
  filename: z.string(),
  path: z.string(),
  mimetype: z.string()
});

// Base contact fields that are always required
const baseContactFields = {
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
//   message: z.string().min(10, 'Message must be at least 10 characters').optional(),
};

// Type-specific validation schemas
const generalInquirySchema = z.object({
  type: z.literal(ContactType.GENERAL),
  subject: z.string().min(3, 'Subject is required'),
  ...baseContactFields
});

const quotationSchema = z.object({
  type: z.literal(ContactType.QUOTATION),
  companyName: z.string().min(2, 'Company name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  productDetails: z.string().min(10, 'Product details are required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  ...baseContactFields
});

const supportSchema = z.object({
  type: z.literal(ContactType.SUPPORT),
  orderNumber: z.string().optional(),
  issueType: z.enum(['Product Usage', 'Technical Issue', 'Account Problem', 'Other']),
  ...baseContactFields
});

const partnershipSchema = z.object({
  type: z.literal(ContactType.PARTNERSHIP),
  companyName: z.string().min(2, 'Company name is required'),
  position: z.string().min(2, 'Position is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  partnershipType: z.enum(['Distribution', 'Reseller', 'Technology Integration', 'Other']),
  ...baseContactFields
});

export const createContactSchema = z.object({
  body: z.discriminatedUnion('type', [
    generalInquirySchema,
    quotationSchema,
    supportSchema,
    partnershipSchema
  ])
});

export const updateContactStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'inProgress', 'resolved', 'closed']),
    resolvedAt: z.date().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })
});