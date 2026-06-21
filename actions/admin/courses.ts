'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { courseSchema } from '@/lib/validations/course'
import type { ActionResult, CurriculumModule } from '@/types'

function parseLines(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (!raw) return []
  return String(raw).split('\n').map((s) => s.trim()).filter(Boolean)
}

function parseCourseForm(formData: FormData) {
  let curriculum: CurriculumModule[] = []
  try {
    const raw = formData.get('curriculum')
    if (raw) curriculum = JSON.parse(String(raw))
  } catch {
    curriculum = []
  }

  const parsed = courseSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    excerpt: formData.get('excerpt'),
    price: formData.get('price'),
    category: formData.get('category'),
    level: formData.get('level'),
    duration: formData.get('duration'),
    instructor: formData.get('instructor'),
    instructor_bio: formData.get('instructor_bio'),
    image_url: formData.get('image_url') || null,
    objectives: formData.get('objectives'),
    requirements: formData.get('requirements'),
    seo_title: formData.get('seo_title'),
    seo_description: formData.get('seo_description'),
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  })

  if (!parsed.success) return { ok: false as const, error: parsed.error.errors[0]?.message }

  const price = parsed.data.price
  return {
    ok: true as const,
    data: {
      ...parsed.data,
      objectives: parseLines(formData, 'objectives'),
      requirements: parseLines(formData, 'requirements'),
      is_free: price === 0,
      curriculum,
    },
  }
}

export async function createCourseAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').insert(parsed.data as never)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}

export async function updateCourseAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').update(parsed.data as never).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}

export async function deleteCourseAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/courses')
}

export async function getAdminCourses() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getAdminCourse(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('id', id).single()
  return data
}
