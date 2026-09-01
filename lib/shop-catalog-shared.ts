export type CatalogLabel = 'jolly-learning' | 'phonics-club'

export interface ShopCatalog {
  name: string
  label: CatalogLabel
  url: string
  size: number
  uploadedAt: string
  source?: 'local' | 'supabase'
}

export const CATALOGS_BUCKET = 'shop-catalogs'
export const MAX_CATALOG_SIZE = 50 * 1024 * 1024

export const CATALOG_LABELS: Record<CatalogLabel, string> = {
  'jolly-learning': 'Jolly Learning Products',
  'phonics-club': 'Phonics Club Products',
}

export function toCatalogPublicUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return `/catalogs/${filename}`
  return `${base}/storage/v1/object/public/${CATALOGS_BUCKET}/${filename}`
}

export function sanitizeCatalogFilename(name: string): string {
  const clean = (name || 'catalog')
    .replace(/\\/g, '-')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase()

  return clean || 'catalog'
}

export function buildCatalogObjectName(
  fileName: string,
  label: CatalogLabel,
  timestamp = Date.now()
): string {
  return `${label}-${timestamp}-${sanitizeCatalogFilename(fileName || 'catalog')}`
}

export function parseCatalogLabel(name: string): CatalogLabel {
  const normalized = name.toLowerCase()
  const words = normalized.replace(/[^a-z0-9]+/g, ' ')
  if (
    normalized.startsWith('phonics-club-') ||
    normalized.startsWith('phonics_club_') ||
    normalized.startsWith('local-') ||
    normalized.includes('phonics-club') ||
    normalized.includes('phonics_club') ||
    words.includes('phonics club')
  ) {
    return 'phonics-club'
  }
  return 'jolly-learning'
}

export function displayCatalogName(name: string): string {
  return name
    .replace(/^\d+-/, '')
    .replace(/^(jolly-learning|phonics-club|uk|local)[-_]/, '')
    .replace(/_/g, ' ')
}
