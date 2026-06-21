'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function createCertificateTemplateAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('certificate_templates').insert({
    name: formData.get('name'),
    description: formData.get('description'),
    template_url: formData.get('template_url'),
    course_id: formData.get('course_id') || null,
  } as never)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/certificates')
  return { success: true }
}

export async function deleteCertificateTemplateAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('certificate_templates').delete().eq('id', id)
  revalidatePath('/admin/certificates')
}

export async function getCertificateTemplates() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('certificate_templates').select('*').order('created_at', { ascending: false })
  return data ?? []
}
