import { z } from 'zod'

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
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: pakistanPhone,
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  zip: z.string().optional(),
  country: z.string().default('Pakistan'),
  paymentMethod: z.enum(['cod', 'credit']),
  couponCode: z.string().optional(),
  memberId: z.string().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92')) return `+${digits}`
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`
  if (digits.length === 10) return `+92${digits}`
  return phone
}
