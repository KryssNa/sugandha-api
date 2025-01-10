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
    role: z.enum(['user', 'admin'], {
      errorMap: () => ({ message: 'Invalid role' })
    }).default('user'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    age: z.number().min(18, 'Must be at least 18 years old').optional(),
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
