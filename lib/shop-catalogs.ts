import { createServiceClient } from '@/lib/supabase/server'

export interface ShopCatalog {
  name: string
  label: 'jolly-learning' | 'phonics-club'
  url: string
  size: number
  uploadedAt: string
}

const CATALOGS_BUCKET = 'shop-catalogs'

function toPublicUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return `/catalogs/${filename}`
  return `${base}/storage/v1/object/public/${CATALOGS_BUCKET}/${filename}`
}

function sanitizeFilename(name: string): string {
  const clean = (name || 'catalog')
    .replace(/\\/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase()

  return clean || 'catalog'
}

function parseLabel(name: string): 'jolly-learning' | 'phonics-club' {
  const normalized = name.toLowerCase()
  if (normalized.startsWith('phonics-club-') || normalized.startsWith('local-')) {
    return 'phonics-club'
  }
  return 'jolly-learning'
}

export async function listShopCatalogs(): Promise<ShopCatalog[]> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.storage.from(CATALOGS_BUCKET).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error || !data) return []

    return data
      .filter((item) => item.name)
      .map((item) => ({
        name: item.name,
        label: parseLabel(item.name),
        url: toPublicUrl(item.name),
        size: item.metadata?.size ?? 0,
        uploadedAt: item.created_at ?? new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

export async function saveShopCatalog(
  file: File,
  label: 'jolly-learning' | 'phonics-club' = 'jolly-learning'
): Promise<ShopCatalog> {
  const filename = sanitizeFilename(file.name || 'catalog') || 'catalog'
  const safeName = `${label}-${Date.now()}-${filename}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const supabase = await createServiceClient()
  const { error } = await supabase.storage.from(CATALOGS_BUCKET).upload(safeName, bytes, {
    contentType: file.type || 'application/pdf',
    upsert: false,
  })

  if (error) throw new Error(error.message)

  return {
    name: safeName,
    label,
    url: toPublicUrl(safeName),
    size: bytes.length,
    uploadedAt: new Date().toISOString(),
  }
}

export async function deleteShopCatalog(name: string): Promise<void> {
  const supabase = await createServiceClient()
  const { error } = await supabase.storage.from(CATALOGS_BUCKET).remove([name])
  if (error) throw new Error(error.message)
}
