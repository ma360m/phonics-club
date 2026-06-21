import { createServiceClient } from '@/lib/supabase/server'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

export function getStoragePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return path
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`
}

export async function uploadProductImageToStorage(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const supabase = await createServiceClient()
  const ext = filename.split('.').pop() ?? 'jpg'
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
  const path = `${Date.now()}-${safeName.endsWith(ext) ? safeName : `${safeName}.${ext}`}`

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw new Error(error.message)

  return { url: getStoragePublicUrl(path), path }
}

export async function deleteProductImageFromStorage(path: string): Promise<void> {
  const supabase = await createServiceClient()
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}
