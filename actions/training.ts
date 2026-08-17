'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import { TRAINING_MONTHS_2026 } from '@/lib/company'
import { notifyAdminOfTrainingRegistration } from '@/lib/email/send-training-registration-admin-email'
import { z } from 'zod'
import type { ActionResult } from '@/types'
import type { TrainingEvent } from '@/types/database'

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

const trainingEventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, 'Enter a training or webinar title.'),
  event_type: z.enum(['onsite_training', 'online_webinar']),
  event_date: z.string().optional().nullable(),
  season: z.string().trim().optional().nullable(),
  status: z.enum(['draft', 'open', 'upcoming', 'closed', 'cancelled']).default('open'),
  description: z.string().trim().optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(10000).default(100),
  published: z.coerce.boolean().default(true),
})

const trainingCertificateSchema = z.object({
  id: z.string().uuid(),
  certificate_url: z.string().trim().url('Enter a valid certificate URL.').optional().or(z.literal('')),
  certificate_emailed: z.boolean().default(false),
  certificate_notes: z.string().trim().max(1000).optional(),
})

const deleteRegistrationSchema = z.object({
  id: z.string().uuid(),
  confirm: z.literal('DELETE'),
})

function trainingEventsTableMissing(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(error?.code === '42P01' || /training_events|schema cache/i.test(error?.message ?? ''))
}

async function notifyTrainingRegistrationAdmin(
  input: z.infer<typeof registrationSchema>,
  options: { userId?: string | null; registrationId?: string | null; source?: string | null } = {},
) {
  await notifyAdminOfTrainingRegistration({
    registrationId: options.registrationId,
    userId: options.userId,
    trainingType: input.training_type,
    eventTitle: input.event_title,
    eventDate: input.event_date ?? null,
    preferredMonth: input.preferred_month,
    approxParticipants: input.approx_participants,
    fullName: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    organization: input.organization ?? null,
    message: input.message ?? null,
    source: options.source,
    requestedAt: new Date(),
  })
}

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
          await notifyTrainingRegistrationAdmin(parsed.data, {
            userId: user?.id ?? null,
            source: 'Website trainings page',
          })
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
    await notifyTrainingRegistrationAdmin(parsed.data, {
      userId: user?.id ?? null,
      source: 'Website trainings page',
    })
    return { success: true }
  } catch {
    console.log('Training registration (demo):', parsed.data)
    await notifyTrainingRegistrationAdmin(parsed.data, {
      userId: user?.id ?? null,
      source: 'Website trainings page fallback',
    })
    return { success: true }
  }
}

export async function getTrainingRegistrations() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('training_registrations')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function updateTrainingRegistrationCertificateAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const parsed = trainingCertificateSchema.safeParse({
    id: formData.get('id'),
    certificate_url: formData.get('certificate_url') || '',
    certificate_emailed: formData.get('certificate_emailed') === 'on',
    certificate_notes: formData.get('certificate_notes') || undefined,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Certificate details are invalid.')

  const certificateUrl = parsed.data.certificate_url || null
  const now = new Date().toISOString()
  const supabase = await createClient()
  const { error } = await supabase
    .from('training_registrations')
    .update({
      certificate_url: certificateUrl,
      certificate_uploaded_at: certificateUrl ? now : null,
      certificate_emailed_at: parsed.data.certificate_emailed ? now : null,
      certificate_notes: parsed.data.certificate_notes ?? null,
    } as never)
    .eq('id', parsed.data.id)

  if (error) {
    if (error.code === '42703') throw new Error('Apply migration 031 before saving training certificate details.')
    throw new Error(error.message)
  }

  revalidatePath('/admin/trainings')
  revalidatePath('/dashboard')
}

export async function deleteTrainingRegistrationAction(
  id: string,
  confirm: string,
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = deleteRegistrationSchema.safeParse({ id, confirm })
  if (!parsed.success) return { success: false, error: 'Type DELETE to confirm registration deletion.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('training_registrations')
    .delete()
    .eq('id', parsed.data.id)

  if (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Registration could not be deleted.') }
  }

  revalidatePath('/admin/trainings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getPublishedTrainingEvents(): Promise<TrainingEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_events')
    .select('*')
    .eq('published', true)
    .neq('status', 'draft')
    .order('sort_order', { ascending: true })
    .order('event_date', { ascending: true })

  if (trainingEventsTableMissing(error)) return []
  if (error) {
    console.error('[Training events] Failed to load public events:', error.message)
    return []
  }
  return (data as TrainingEvent[]) ?? []
}

export async function getAdminTrainingEvents(): Promise<TrainingEvent[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_events')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[Training events] Failed to load admin events:', trainingEventsTableMissing(error) ? 'Apply migration 030.' : error.message)
    return []
  }
  return (data as TrainingEvent[]) ?? []
}

export async function upsertTrainingEventAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = trainingEventSchema.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    event_type: formData.get('event_type'),
    event_date: formData.get('event_date') || null,
    season: formData.get('season') || null,
    status: formData.get('status') || 'open',
    description: formData.get('description') || null,
    sort_order: formData.get('sort_order') || 100,
    published: formData.get('published') === 'on',
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const payload = {
    ...parsed.data,
    event_date: parsed.data.event_date || null,
    season: parsed.data.season || null,
    description: parsed.data.description || null,
    created_by: admin.id,
  }

  const supabase = await createClient()
  const { error } = parsed.data.id
    ? await supabase.from('training_events').update(payload as never).eq('id', parsed.data.id)
    : await supabase.from('training_events').insert(payload as never)

  if (error) {
    return {
      success: false,
      error: trainingEventsTableMissing(error)
        ? 'Training events need database migration 030 applied in Supabase, then the schema cache refreshed.'
        : friendlyErrorMessage(error, 'Training event could not be saved.'),
    }
  }

  revalidatePath('/trainings')
  revalidatePath('/admin/trainings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTrainingEventAction(id: string): Promise<void> {
  await requireAdmin()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return

  const supabase = await createClient()
  await supabase.from('training_events').delete().eq('id', parsed.data)
  revalidatePath('/trainings')
  revalidatePath('/admin/trainings')
  revalidatePath('/dashboard')
}
