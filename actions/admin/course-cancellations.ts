'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { CourseCancellationRequest } from '@/types/database'

const updateCancellationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  admin_notes: z.string().trim().optional(),
})

export async function getAdminCourseCancellationRequests(): Promise<CourseCancellationRequest[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_cancellation_requests')
    .select('*, courses(id,title,slug), profiles(full_name,email)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Course cancellations] Failed to load:', error.message)
    return []
  }
  return (data as CourseCancellationRequest[]) ?? []
}

export async function updateCourseCancellationRequestAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const parsed = updateCancellationSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    admin_notes: formData.get('admin_notes') || undefined,
  })
  if (!parsed.success) throw new Error('Choose approve or reject.')

  const supabase = await createClient()
  const { data: request, error: fetchError } = await supabase
    .from('course_cancellation_requests')
    .select('id, enrollment_id')
    .eq('id', parsed.data.id)
    .maybeSingle()

  if (fetchError || !request) throw new Error('Cancellation request could not be found.')

  const { error } = await supabase
    .from('course_cancellation_requests')
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.admin_notes ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq('id', parsed.data.id)

  if (error) throw new Error(error.message)

  if (parsed.data.status === 'approved' && request.enrollment_id) {
    await supabase
      .from('enrollments')
      .update({ status: 'cancelled' } as never)
      .eq('id', request.enrollment_id)
  }

  revalidatePath('/admin/course-cancellations')
  revalidatePath('/dashboard/my-courses')
  revalidatePath('/dashboard')
}
