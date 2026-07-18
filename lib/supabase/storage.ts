import { createServiceClient } from '@/lib/supabase/server'

export const PRODUCT_IMAGES_BUCKET = 'product-images'
export const SITE_MEDIA_BUCKET = 'site-media'

export function getStoragePublicUrl(path: string, bucket = PRODUCT_IMAGES_BUCKET): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return path
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

function safeStoragePath(filename: string, folder = '') {
  const ext = filename.split('.').pop() ?? 'bin'
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`
  const cleanFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '-').replace(/^\/+|\/+$/g, '')
  return `${cleanFolder ? `${cleanFolder}/` : ''}${Date.now()}-${finalName}`
}

export async function uploadProductImageToStorage(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const supabase = await createServiceClient()
  const path = safeStoragePath(filename)

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw new Error(error.message)

  return { url: getStoragePublicUrl(path, PRODUCT_IMAGES_BUCKET), path }
}

export async function uploadSiteMediaToStorage(
  file: Buffer,
  filename: string,
  contentType: string,
  folder = 'site-content'
): Promise<{ url: string; path: string }> {
  const supabase = await createServiceClient()
  const path = safeStoragePath(filename, folder)

  const { error } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw new Error(error.message)

  return { url: getStoragePublicUrl(path, SITE_MEDIA_BUCKET), path }
}

export async function deleteProductImageFromStorage(path: string): Promise<void> {
  const supabase = await createServiceClient()
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}
