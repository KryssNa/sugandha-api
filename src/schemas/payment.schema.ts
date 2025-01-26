// schemas/payment.schema.ts
import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    orderId: z.string(),
    amount: z.number().positive(),
    paymentMethod: z.enum(['esewa', 'khalti', 'cod'])
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    method: z.enum(['esewa', 'khalti']),
    pid: z.string(),
    status: z.enum(['success', 'failure'])
  })
});

export type InitiatePaymentBody = z.infer<typeof initiatePaymentSchema>['body'];
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>['body'];