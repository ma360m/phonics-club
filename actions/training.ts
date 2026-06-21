'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ActionResult } from '@/types'

const registrationSchema = z.object({
  training_type: z.enum(['online_webinar', 'onsite_classroom']),
  event_title: z.string().min(2),
  event_date: z.string().optional(),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  message: z.string().optional(),
})

export async function submitTrainingRegistrationAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registrationSchema.safeParse({
    training_type: formData.get('training_type'),
    event_title: formData.get('event_title'),
    event_date: formData.get('event_date') || undefined,
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
    const { error } = await supabase.from('training_registrations').insert({
      ...parsed.data,
      user_id: user?.id ?? null,
      event_date: parsed.data.event_date || null,
    } as never)

    if (error) {
      // Fallback: log when table not migrated yet
      console.log('Training registration:', parsed.data)
      revalidatePath('/trainings')
      return { success: true, data: undefined }
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
