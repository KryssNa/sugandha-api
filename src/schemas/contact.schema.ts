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
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  ...baseContactFields
});

const quotationSchema = z.object({
  type: z.literal(ContactType.QUOTATION),
  companyName: z.string({ required_error: "company name is required" }).min(2, 'Company name must be at least 2 characters'),
  phone: z.string({ required_error: "Valid phone number is required" }).min(10, 'Valid phone number must be at least 10 characters'),
  productDetails: z.string({ required_error: "Product details are required" }).min(10, 'Product details must be at least 10 characters'),
  quantity: z.string({ required_error: "qunatity is required" }).min(1, 'Quantity must be greater than 0'),
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
  companyName: z.string({ required_error: "Company name is required" }).min(2, 'Company name must be at least 2 characters'),
  position: z.string({ required_error: "Position is required" }).min(2, 'Position must be at least 2 characters'),
  phone: z.string({ required_error: "Valid phone number is required" }).min(10, 'Valid phone number must be at least 10 characters'),
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