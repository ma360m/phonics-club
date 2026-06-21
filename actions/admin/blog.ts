'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { blogPostSchema } from '@/lib/validations/blog'
import type { ActionResult } from '@/types'

function parseBlogForm(formData: FormData) {
  const tagsRaw = formData.get('tags')
  const tags = tagsRaw
    ? String(tagsRaw).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return blogPostSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    category: formData.get('category'),
    tags: tags.join(','),
    cover_image: formData.get('cover_image') || null,
    published: formData.get('published') === 'on',
    seo_title: formData.get('seo_title'),
    seo_description: formData.get('seo_description'),
  })
}

export async function createBlogPostAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdmin()
  const parsed = parseBlogForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const tags = parsed.data.tags
    ? String(parsed.data.tags).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const { tags: _tags, ...rest } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('blog_posts').insert({
    ...rest,
    tags,
    author_id: profile.id,
  } as never)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function updateBlogPostAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseBlogForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const tags = parsed.data.tags
    ? String(parsed.data.tags).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const { tags: _tags, ...rest } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('blog_posts').update({ ...rest, tags } as never).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function deleteBlogPostAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/blog')
}

export async function getAdminBlogPosts() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getAdminBlogPost(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  return data
}
