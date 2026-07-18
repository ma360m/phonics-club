export function normalizeMediaUrl(src?: string | null): string | null {
  const cleaned = String(src ?? '')
    .trim()
    .replace(/^["']+|["']+$/g, '')

  if (!cleaned) return null
  if (/^https?:\/\//i.test(cleaned)) return cleaned
  if (cleaned.startsWith('/')) return cleaned

  const normalized = cleaned.replace(/\\/g, '/')
  if (normalized.startsWith('public/')) return `/${normalized.slice('public/'.length)}`
  if (normalized.startsWith('images/')) return `/${normalized}`

  const publicIndex = normalized.toLowerCase().lastIndexOf('/public/')
  if (publicIndex >= 0) return normalized.slice(publicIndex + '/public'.length)

  const imagesMatch = normalized.match(/images\/.+$/i)
  if (imagesMatch) return `/${imagesMatch[0]}`

  return null
}
