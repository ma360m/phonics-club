import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'

export interface NewsletterIssue {
  id: string
  title: string
  month: number
  year: number
  file_url: string
  file_path: string
  file_size: number
  published: boolean
  created_at: string
  updated_at: string
}

export const NEWSLETTERS_BUCKET = 'newsletters'

export function formatNewsletterMonth(month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, month - 1, 1))
}

function getNewsletterPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return path
  return `${base}/storage/v1/object/public/${NEWSLETTERS_BUCKET}/${path}`
}

function sanitizeFilename(name: string): string {
  return (name || 'newsletter.pdf')
    .replace(/\\/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase() || 'newsletter.pdf'
}

export async function listNewsletterIssues(options?: { admin?: boolean }): Promise<NewsletterIssue[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
    let query = supabase.from('newsletter_issues').select('*')
    if (!options?.admin) query = query.eq('published', true)

    const { data, error } = await query
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return []
    return (data ?? []) as NewsletterIssue[]
  } catch {
    return []
  }
}

export async function uploadNewsletterIssue(input: {
  file: File
  title: string
  month: number
  year: number
  published: boolean
}): Promise<NewsletterIssue> {
  const safeName = sanitizeFilename(input.file.name)
  const path = `${input.year}/${String(input.month).padStart(2, '0')}-${Date.now()}-${safeName}`
  const bytes = Buffer.from(await input.file.arrayBuffer())
  const supabase = await createServiceClient()

  const { error: uploadError } = await supabase.storage
    .from(NEWSLETTERS_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type || 'application/pdf',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const payload = {
    title: input.title,
    month: input.month,
    year: input.year,
    file_path: path,
    file_url: getNewsletterPublicUrl(path),
    file_size: bytes.length,
    published: input.published,
  }

  const { data, error } = await supabase
    .from('newsletter_issues')
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as NewsletterIssue
}

export async function deleteNewsletterIssue(id: string): Promise<void> {
  const supabase = await createServiceClient()
  const { data, error: fetchError } = await supabase
    .from('newsletter_issues')
    .select('file_path')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const filePath = data?.file_path
  const { error: deleteError } = await supabase.from('newsletter_issues').delete().eq('id', id)
  if (deleteError) throw new Error(deleteError.message)

  if (filePath) {
    await supabase.storage.from(NEWSLETTERS_BUCKET).remove([filePath])
  }
}
