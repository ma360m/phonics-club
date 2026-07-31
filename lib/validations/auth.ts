import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  lastOrderItem: z.string().trim().max(120).optional(),
  lastOrderQuantity: z.coerce.number().int().positive().optional().nullable(),
}).refine((data) => Boolean(data.phone || data.city || data.lastOrderItem || data.lastOrderQuantity), {
  message: 'Enter at least one verification detail.',
  path: ['phone'],
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
