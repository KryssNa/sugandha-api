// src/schemas/user.schema.ts
import { z } from "zod";


export const createUserSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password is too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password is too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
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
