import { createServiceClient } from '@/lib/supabase/server'
import { toError } from '@/lib/friendly-error'

export const PRODUCT_IMAGES_BUCKET = 'product-images'
export const SITE_MEDIA_BUCKET = 'site-media'
export const BLOG_GALLERY_BUCKET = 'blog-gallery'

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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is missing', 'Product image upload failed.')
  }
  const supabase = await createServiceClient()
  const path = safeStoragePath(filename)

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw toError(error, 'Product image upload failed.')

  return { url: getStoragePublicUrl(path, PRODUCT_IMAGES_BUCKET), path }
}

export async function uploadSiteMediaToStorage(
  file: Buffer,
  filename: string,
  contentType: string,
  folder = 'site-content'
): Promise<{ url: string; path: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is missing', 'Media upload failed.')
  }
  const supabase = await createServiceClient()
  const path = safeStoragePath(filename, folder)

  const { error } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw toError(error, 'Media upload failed.')

  return { url: getStoragePublicUrl(path, SITE_MEDIA_BUCKET), path }
}

export async function uploadBlogGalleryImageToStorage(
  file: Buffer,
  filename: string,
  contentType: string,
  folder = 'blog-gallery'
): Promise<{ url: string; path: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is missing', 'Blog gallery upload failed.')
  }
  const supabase = await createServiceClient()
  const path = safeStoragePath(filename, folder)

  const { error } = await supabase.storage
    .from(BLOG_GALLERY_BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw toError(error, 'Blog gallery upload failed.')

  return { url: getStoragePublicUrl(path, BLOG_GALLERY_BUCKET), path }
}

export async function deleteProductImageFromStorage(path: string): Promise<void> {
  const supabase = await createServiceClient()
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}
