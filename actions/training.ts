'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import { TRAINING_MONTHS_2026 } from '@/lib/company'
import { z } from 'zod'
import type { ActionResult } from '@/types'

const allowedTrainingMonths = TRAINING_MONTHS_2026.map((month) => month.value) as [string, ...string[]]

const registrationSchema = z.object({
  training_type: z.enum(['online_webinar', 'onsite_classroom']),
  event_title: z.string().trim().min(2, 'Choose a training or webinar name.'),
  event_date: z
    .string()
    .optional()
    .refine((value) => !value || value >= '2026-08-01', 'Training dates must be August 2026 or later.'),
  preferred_month: z.enum(allowedTrainingMonths, {
    errorMap: () => ({ message: 'Choose a preferred month from August 2026 onward.' }),
  }),
  approx_participants: z.coerce
    .number({ invalid_type_error: 'Enter the approximate number of participants.' })
    .int('Participants must be a whole number.')
    .min(1, 'Enter at least 1 participant.')
    .max(10000, 'Participant count looks too high. Enter a realistic estimate.'),
  full_name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  message: z.string().trim().optional(),
})

export async function submitTrainingRegistrationAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registrationSchema.safeParse({
    training_type: formData.get('training_type'),
    event_title: formData.get('event_title'),
    event_date: formData.get('event_date') || undefined,
    preferred_month: formData.get('preferred_month'),
    approx_participants: formData.get('approx_participants'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    organization: formData.get('organization') || undefined,
    message: formData.get('message') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message }
  }

  const rl = rateLimit(`training:${parsed.data.email}`, 5, 300_000)
  if (!rl.success) return { success: false, error: 'Too many requests. Try again later.' }

  const user = await getSession()

  try {
    const supabase = await createClient()
    const payload = {
      ...parsed.data,
      user_id: user?.id ?? null,
      event_date: parsed.data.event_date || null,
    }
    const { error } = await supabase.from('training_registrations').insert(payload as never)

    if (error) {
      if (error.code === '42703') {
        const legacyMessage = [
          parsed.data.message,
          `Preferred month: ${parsed.data.preferred_month}`,
          `Approx participants: ${parsed.data.approx_participants}`,
        ].filter(Boolean).join('\n')
        const { error: retryError } = await supabase.from('training_registrations').insert({
          training_type: parsed.data.training_type,
          event_title: parsed.data.event_title,
          event_date: parsed.data.event_date || null,
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          organization: parsed.data.organization,
          message: legacyMessage,
          user_id: user?.id ?? null,
        } as never)

        if (!retryError) {
          revalidatePath('/trainings')
          revalidatePath('/admin/trainings')
          return { success: true }
        }
      }

      console.log('Training registration:', parsed.data)
      revalidatePath('/trainings')
      return { success: false, error: friendlyErrorMessage(error, 'Training registration could not be saved.') }
    }

    revalidatePath('/trainings')
    revalidatePath('/admin/trainings')
    return { success: true }
  } catch {
    console.log('Training registration (demo):', parsed.data)
    return { success: true }
  }
}

export async function getTrainingRegistrations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('training_registrations')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}
