'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { blogPostSchema } from '@/lib/validations/blog'
import { getTrainingEventBlogPosts } from '@/lib/data/training-events-blog'
import { SEED_BLOG_POSTS } from '@/lib/data/seed'
import type { ActionResult } from '@/types'
import type { BlogPost } from '@/types/database'

function parseBlogForm(formData: FormData) {
  const tagsRaw = formData.get('tags')
  const tags = tagsRaw
    ? String(tagsRaw).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  let galleryImages: unknown[] = []
  try {
    const galleryRaw = formData.get('gallery_images')
    galleryImages = galleryRaw ? JSON.parse(String(galleryRaw)) : []
  } catch {
    galleryImages = []
  }

  return blogPostSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    category: formData.get('category'),
    tags: tags.join(','),
    cover_image: formData.get('cover_image') || null,
    gallery_images: galleryImages,
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
  const profile = await requireAdmin()
  const parsed = parseBlogForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const tags = parsed.data.tags
    ? String(parsed.data.tags).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const { tags: _tags, ...rest } = parsed.data
  const supabase = await createClient()
  const fallback = getEditableStaticBlogPosts().find((post) => post.id === id)
  const payload = { ...rest, tags }
  const { error } = fallback
    ? await supabase.from('blog_posts').upsert({ ...payload, author_id: profile.id } as never, { onConflict: 'slug' })
    : await supabase.from('blog_posts').update(payload as never).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  revalidatePath(`/blog/${parsed.data.slug}`)
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
  const databasePosts = (data as BlogPost[]) ?? []
  const databaseSlugs = new Set(databasePosts.map((post) => post.slug))
  return [
    ...databasePosts,
    ...getEditableStaticBlogPosts().filter((post) => !databaseSlugs.has(post.slug)),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getAdminBlogPost(id: string) {
  await requireAdmin()
  if (id.startsWith('static-')) {
    return getEditableStaticBlogPosts().find((post) => post.id === id) ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle()
  return data ?? getEditableStaticBlogPosts().find((post) => post.id === id) ?? null
}

function getEditableStaticBlogPosts(): BlogPost[] {
  return [...getTrainingEventBlogPosts(), ...SEED_BLOG_POSTS].map((post) => ({
    ...post,
    id: post.id.startsWith('static-') ? post.id : `static-${post.id}`,
  }))
}
