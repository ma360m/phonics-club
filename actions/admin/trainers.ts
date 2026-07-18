'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { slugify } from '@/utils/slug'
import type { ActionResult } from '@/types'

function listFromForm(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseTrainerForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()

  return {
    name,
    slug: slug ? slugify(slug) : slugify(name),
    title: String(formData.get('title') ?? '').trim() || null,
    bio: String(formData.get('bio') ?? '').trim() || null,
    image_url: String(formData.get('image_url') ?? '').trim() || null,
    achievements: listFromForm(formData.get('achievements')),
    credentials: listFromForm(formData.get('credentials')),
    specialties: listFromForm(formData.get('specialties')),
    profile_details: String(formData.get('profile_details') ?? '').trim() || null,
    sort_order: Number(formData.get('sort_order') ?? 0),
    published: formData.get('published') === 'on',
  }
}

function revalidateTrainerPaths(slug?: string | null) {
  revalidatePath('/admin/trainers')
  revalidatePath('/certified-trainers')
  if (slug) revalidatePath(`/certified-trainers/${slug}`)
}

export async function createTrainerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const payload = parseTrainerForm(formData)
  if (!payload.name) return { success: false, error: 'Name is required' }

  const supabase = await createClient()
  const { error } = await supabase.from('trainers').insert(payload as never)
  if (error) return { success: false, error: error.message }

  revalidateTrainerPaths(payload.slug)
  return { success: true }
}

export async function updateTrainerAction(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const payload = parseTrainerForm(formData)
  if (!payload.name) return { success: false, error: 'Name is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('trainers')
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateTrainerPaths(payload.slug)
  return { success: true }
}

export async function deleteTrainerAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('trainers').delete().eq('id', id)
  revalidateTrainerPaths()
}

export async function getAdminTrainers() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('trainers').select('*').order('sort_order')
  return data ?? []
}
