'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { TRAINER_PROFILE_ATTACHMENTS_KEY } from '@/lib/site-content'
import { slugify } from '@/utils/slug'
import type { ActionResult } from '@/types'
import type { TrainerProfileAttachment, TrainerProfileAttachments } from '@/lib/site-content'

function listFromForm(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function listFromValues(values: FormDataEntryValue[]) {
  return values
    .flatMap((value) => String(value ?? '').split(/\r?\n/))
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeArticleSlug(value: string) {
  const withoutOrigin = value
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/^blog\//i, '')
    .replace(/^newsletter\//i, '')
    .replace(/^newsletters\//i, '')
    .replace(/\/+$/, '')
  return withoutOrigin.includes(' ') ? slugify(withoutOrigin) : withoutOrigin
}

function parseTrainerAttachmentForm(formData: FormData): TrainerProfileAttachment {
  const articleSlugs = [
    ...listFromValues(formData.getAll('article_slugs')),
    ...listFromForm(formData.get('extra_article_slugs')),
  ].map(normalizeArticleSlug).filter(Boolean)
  const linkLabels = formData.getAll('related_link_label')
  const linkHrefs = formData.getAll('related_link_href')
  const linkDescriptions = formData.getAll('related_link_description')
  const relatedLinks = linkHrefs.map((hrefValue, index) => {
    const href = String(hrefValue ?? '').trim()
    const label = String(linkLabels[index] ?? '').trim()
    if (!href || !label) return null
    return {
      label,
      href,
      description: String(linkDescriptions[index] ?? '').trim() || undefined,
    }
  }).filter(Boolean) as TrainerProfileAttachment['relatedLinks']
  const gallerySources = formData.getAll('gallery_src')
  const galleryAlts = formData.getAll('gallery_alt')
  const galleryCaptions = formData.getAll('gallery_caption')
  const galleryImages = gallerySources.map((source, index) => {
    const src = String(source ?? '').trim()
    if (!src) return null
    return {
      src,
      alt: String(galleryAlts[index] ?? '').trim() || 'Trainer gallery image',
      caption: String(galleryCaptions[index] ?? '').trim() || undefined,
    }
  }).filter(Boolean) as TrainerProfileAttachment['galleryImages']

  return {
    articleSlugs: [...new Set(articleSlugs)],
    relatedLinks,
    galleryImages,
    includeAutoArticles: formData.get('include_auto_articles') === 'on',
    includeAutoGallery: formData.get('include_auto_gallery') === 'on',
  }
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

async function getTrainerAttachments(supabase: Awaited<ReturnType<typeof createClient>>): Promise<TrainerProfileAttachments> {
  const { data } = await supabase
    .from('site_content')
    .select('content')
    .eq('key', TRAINER_PROFILE_ATTACHMENTS_KEY)
    .maybeSingle()
  return (data?.content && typeof data.content === 'object' && !Array.isArray(data.content))
    ? data.content as TrainerProfileAttachments
    : {}
}

async function saveTrainerAttachment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  attachment: TrainerProfileAttachment,
  previousSlug?: string | null,
) {
  const attachments = await getTrainerAttachments(supabase)
  const next = { ...attachments }
  if (previousSlug && previousSlug !== slug) delete next[previousSlug]
  next[slug] = attachment
  const { error } = await supabase
    .from('site_content')
    .upsert({
      key: TRAINER_PROFILE_ATTACHMENTS_KEY,
      content: next,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'key' })
  return error
}

async function deleteTrainerAttachment(supabase: Awaited<ReturnType<typeof createClient>>, slug?: string | null) {
  if (!slug) return null
  const attachments = await getTrainerAttachments(supabase)
  if (!attachments[slug]) return null
  const next = { ...attachments }
  delete next[slug]
  const { error } = await supabase
    .from('site_content')
    .upsert({
      key: TRAINER_PROFILE_ATTACHMENTS_KEY,
      content: next,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'key' })
  return error
}

export async function createTrainerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const payload = parseTrainerForm(formData)
  const attachment = parseTrainerAttachmentForm(formData)
  if (!payload.name) return { success: false, error: 'Name is required' }

  const supabase = await createClient()
  const { error } = await supabase.from('trainers').insert(payload as never)
  if (error) return { success: false, error: error.message }
  const attachmentError = await saveTrainerAttachment(supabase, payload.slug, attachment)
  if (attachmentError) return { success: false, error: attachmentError.message }

  revalidateTrainerPaths(payload.slug)
  return { success: true }
}

export async function updateTrainerAction(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const payload = parseTrainerForm(formData)
  const attachment = parseTrainerAttachmentForm(formData)
  if (!payload.name) return { success: false, error: 'Name is required' }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('trainers')
    .select('name, slug')
    .eq('id', id)
    .maybeSingle()
  const previousSlug = existing
    ? String((existing as { slug?: string | null; name?: string | null }).slug || slugify(String((existing as { name?: string | null }).name ?? '')) || '')
    : null
  const { error } = await supabase
    .from('trainers')
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  const attachmentError = await saveTrainerAttachment(supabase, payload.slug, attachment, previousSlug)
  if (attachmentError) return { success: false, error: attachmentError.message }
  if (previousSlug && previousSlug !== payload.slug) revalidateTrainerPaths(previousSlug)
  revalidateTrainerPaths(payload.slug)
  return { success: true }
}

export async function deleteTrainerAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('trainers')
    .select('name, slug')
    .eq('id', id)
    .maybeSingle()
  const existingSlug = existing
    ? String((existing as { slug?: string | null; name?: string | null }).slug || slugify(String((existing as { name?: string | null }).name ?? '')) || '')
    : null
  await supabase.from('trainers').delete().eq('id', id)
  await deleteTrainerAttachment(supabase, existingSlug)
  if (existingSlug) revalidateTrainerPaths(existingSlug)
  revalidateTrainerPaths()
}

export async function getAdminTrainers() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('trainers').select('*').order('sort_order')
  return data ?? []
}
