'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function createTrainerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('trainers').insert({
    name: formData.get('name'),
    title: formData.get('title'),
    bio: formData.get('bio'),
    image_url: formData.get('image_url') || null,
    sort_order: Number(formData.get('sort_order') ?? 0),
    published: formData.get('published') === 'on',
  } as never)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/trainers')
  revalidatePath('/certified-trainers')
  return { success: true }
}

export async function deleteTrainerAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('trainers').delete().eq('id', id)
  revalidatePath('/admin/trainers')
  revalidatePath('/certified-trainers')
}

export async function getAdminTrainers() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('trainers').select('*').order('sort_order')
  return data ?? []
}
