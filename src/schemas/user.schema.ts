// src/schemas/user.schema.ts
import { z } from "zod";


export const createUserSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name is too long'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name is too long'),
    contact: z.string().optional(),

    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    role: z.enum(['user', 'admin'], {
      errorMap: () => ({ message: 'Invalid role' })
    }).default('user'),
  }),
});

export const updateUserSchema = z.object({
  // params: z.object({
  //   id: z.string().min(1, 'User ID is required'),
  // }).optional(),
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    contact: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});
