import { z } from 'zod'

export const checkoutPaymentMethods = ['cod', 'bank_transfer', 'jazzcash', 'easypaisa', 'credit'] as const

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

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: pakistanPhone,
  address: z.string().trim().min(5, 'Enter a complete delivery address.'),
  city: z.string().trim().min(2, 'Enter your city.'),
  zip: z.string().trim().optional(),
  country: z.string().default('Pakistan'),
  paymentMethod: z.enum(checkoutPaymentMethods, {
    errorMap: () => ({ message: 'Choose Cash on Delivery, bank transfer, JazzCash, or EasyPaisa.' }),
  }),
  couponCode: z.string().trim().optional(),
  memberId: z.string().trim().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92')) return `+${digits}`
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`
  if (digits.length === 10) return `+92${digits}`
  return phone
}
