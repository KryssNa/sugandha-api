import { z } from 'zod';

// Shared address validation
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required')
});

// Base user schema (works for both guest and registered users)
const baseUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number")
});

export const checkoutItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })
});
const paymentDetailsSchema = z.object({
    method: z.enum([
      'credit-card', 
      'khalti', 
      'esewa', 
      'cash-on-delivery'
    ]),
    details: z.optional(z.object({
      // Specific payment method details can be added here
      cardNumber: z.string().optional(),
      expiryMonth: z.number().optional(),
      expiryYear: z.number().optional(),
      cvv: z.string().optional()
    }))
  });
  // Guest user details schema
const guestUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
});

export const checkoutSchema = z.object({
  body: z.object({
    isGuest: z.boolean().optional().default(false),
    guestUserDetails: z.optional(guestUserSchema),
    orderData: z.object({
      items: z.array(z.object({
        product: z.string({ message: 'Product ID is required' }),
        name: z.string({ message: 'Product name is required' }),
        price: z.number().positive({ message: 'Price must be positive' }),
        quantity: z.number().int().positive({ message: 'Quantity must be positive' })
      })).nonempty({ message: 'At least one item is required' }),
      shippingAddress: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().min(10, 'Invalid phone number'),
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        country: z.string().min(1, 'Country is required'),
        postalCode: z.string().min(1, 'Postal code is required')
      }),
      totalAmount: z.number().positive({ message: 'Total amount must be positive' }),
      subtotal: z.number().positive({ message: 'Subtotal amount must be positive' }),
      tax: z.number().optional(),
      shippingCost: z.number().optional()
    }),
    paymentData: paymentDetailsSchema
  })
});

// Schema for guest user registration (optional)
export const guestUserRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
});



export const paymentRetrySchema = z.object({
    body: z.object({
      paymentData: paymentDetailsSchema
    })
  });