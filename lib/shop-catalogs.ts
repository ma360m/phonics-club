import { createServiceClient } from '@/lib/supabase/server'
import {
  buildCatalogObjectName,
  CATALOGS_BUCKET,
  parseCatalogLabel,
  toCatalogPublicUrl,
  type CatalogLabel,
  type ShopCatalog,
} from '@/lib/shop-catalog-shared'

export type { ShopCatalog } from '@/lib/shop-catalog-shared'

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
        label: parseCatalogLabel(item.name),
        url: toCatalogPublicUrl(item.name),
        size: item.metadata?.size ?? 0,
        uploadedAt: item.created_at ?? new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

export async function saveShopCatalog(
  file: File,
  label: CatalogLabel = 'jolly-learning'
): Promise<ShopCatalog> {
  const safeName = buildCatalogObjectName(file.name, label)
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
    url: toCatalogPublicUrl(safeName),
    size: bytes.length,
    uploadedAt: new Date().toISOString(),
  }
}

export async function deleteShopCatalog(name: string): Promise<void> {
  const supabase = await createServiceClient()
  const { error } = await supabase.storage.from(CATALOGS_BUCKET).remove([name])
  if (error) throw new Error(error.message)
}
