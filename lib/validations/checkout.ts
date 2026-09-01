import { z } from 'zod'

export const checkoutPaymentMethods = ['cod', 'bank_transfer', 'credit'] as const

const pakistanPhone = z
  .string()
  .min(10, 'Phone number is required')
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      return (
        (digits.startsWith('92') && digits.length === 12 && digits[2] === '3') ||
        (digits.startsWith('0') && digits.length === 11 && digits[1] === '3') ||
        (digits.length === 10 && digits[0] === '3')
      )
    },
    { message: 'Enter a valid Pakistan mobile number (e.g. 0300 8079480 or +92 300 8079480)' }
  )

const optionalEmail = z.preprocess(
  (value) => String(value ?? '').trim(),
  z
    .string()
    .max(255, 'Enter a shorter email address.')
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address.',
    }),
)

export const checkoutBaseSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120, 'Enter a shorter full name.'),
  email: optionalEmail,
  phone: pakistanPhone,
  address: z.string().trim().min(5, 'Enter a complete delivery address.'),
  city: z.string().trim().min(2, 'Enter your city.'),
  zip: z.string().trim().optional(),
  country: z.string().default('Pakistan'),
  paymentMethod: z.enum(checkoutPaymentMethods, {
    errorMap: () => ({ message: 'Choose Cash on Delivery or Bank Transfer.' }),
  }),
  couponCode: z.string().trim().optional(),
  memberId: z.string().trim().optional(),
})

export const checkoutSchema = checkoutBaseSchema.superRefine((value, ctx) => {
  if (value.couponCode?.trim() && value.memberId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['couponCode'],
      message: 'Use either a coupon code or Member ID, not both.',
    })
  }
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92')) return `+${digits}`
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`
  if (digits.length === 10) return `+92${digits}`
  return phone
}
