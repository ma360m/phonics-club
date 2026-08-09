function rawMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    return String(record.message ?? record.error_description ?? record.error ?? '')
  }
  return String(error)
}

function compact(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

export function friendlyErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const detail = compact(rawMessage(error))
  const lower = detail.toLowerCase()

  if (!detail) {
    return `${fallback} Try again. If it keeps happening, check the server logs for the missing detail.`
  }

  if (
    lower.includes('next_public_supabase_url') ||
    lower.includes('next_public_supabase_anon_key') ||
    lower.includes('supabase is not configured')
  ) {
    return 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and .env.local, then redeploy or restart the dev server.'
  }

  if (lower.includes('supabase_service_role_key')) {
    return 'Supabase admin access is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel and .env.local. This is required for admin uploads and protected LMS actions.'
  }

  if (
    lower.includes('cloudinary not configured') ||
    lower.includes('cloudinary') && (lower.includes('api_key') || lower.includes('api secret') || lower.includes('cloud_name'))
  ) {
    return 'Cloudinary upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, or use the Supabase media uploader instead.'
  }

  if (lower.includes('resend') || lower.includes('email') && lower.includes('api key')) {
    return 'Order email could not be sent because email delivery is not configured. Add cPanel SMTP settings (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ORDER_EMAIL_FROM, ORDER_ADMIN_EMAIL) or RESEND_API_KEY, then redeploy.'
  }

  if (lower.includes('duplicate key') || lower.includes('23505') || lower.includes('already exists')) {
    return 'This value already exists. Use a unique title, slug, invoice number, coupon code, or ISBN. For slugs, use lowercase words separated by hyphens, for example jolly-phonics-free-course.'
  }

  if (lower.includes('slug') || lower.includes('lowercase') || lower.includes('regex')) {
    return 'The slug is not valid. Use only lowercase letters, numbers, and hyphens. Example: teaching-english-jolly-phonics.'
  }

  if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('permission denied') || lower.includes('not authorized')) {
    return 'Permission was blocked by Supabase. Make sure you are signed in as an admin and that the required RLS policy or service role key is configured.'
  }

  if (lower.includes('foreign key') || lower.includes('23503')) {
    return 'This item is linked to another record. Save the parent course/module first, or remove linked lessons/resources before deleting it.'
  }

  if (lower.includes('bucket') || lower.includes('storage')) {
    return 'Supabase Storage could not save or read this file. Check that the required bucket exists, storage policies are applied, and SUPABASE_SERVICE_ROLE_KEY is set.'
  }

  if (
    lower.includes('file exceeds') ||
    (lower.includes('file must be') && lower.includes('mb or smaller')) ||
    lower.includes('body exceeded') ||
    lower.includes('payload') ||
    lower.includes('413')
  ) {
    return 'The file is too large for the current upload limit. Compress the file, upload a smaller file, or increase ADMIN_MEDIA_UPLOAD_MAX_MB in the environment settings.'
  }

  if (lower.includes('file type') || lower.includes('mime') || lower.includes('not allowed') || lower.includes('only image and video')) {
    return 'This file type is not supported here. Use images for thumbnails, MP4/WebM for videos, or PDF/Office/ZIP files for course resources.'
  }

  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('econn') || lower.includes('timeout')) {
    return 'The server could not reach a required service. Check the Supabase, Cloudinary, SMTP/Resend, or Vercel connection and try again.'
  }

  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'A Supabase table or migration is missing. Run the latest SQL migrations, then redeploy or restart the app.'
  }

  return `${fallback} ${detail}`
}

export function toError(error: unknown, fallback?: string): Error {
  return new Error(friendlyErrorMessage(error, fallback))
}
