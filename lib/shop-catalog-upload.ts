import { createClient } from '@/lib/supabase/client'
import {
  buildCatalogObjectName,
  CATALOGS_BUCKET,
  MAX_CATALOG_SIZE,
  type CatalogLabel,
} from '@/lib/shop-catalog-shared'

export async function uploadShopCatalogDirect(
  file: File,
  label: CatalogLabel
): Promise<string> {
  if (file.size > MAX_CATALOG_SIZE) {
    throw new Error('Catalog file must be 50 MB or smaller.')
  }

  const objectName = buildCatalogObjectName(file.name, label)
  const supabase = createClient()
  const { error } = await supabase.storage.from(CATALOGS_BUCKET).upload(objectName, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/pdf',
    upsert: false,
  })

  if (error) throw new Error(error.message)
  return objectName
}
