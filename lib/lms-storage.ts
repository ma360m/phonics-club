import { createServiceClient } from '@/lib/supabase/server'
import { getUserEnrollment, isEnrollmentActive } from '@/lib/lms'
import type { CourseResource } from '@/types/database'

export const LMS_BUCKETS = {
  resources: 'course-resources',
  videos: 'course-videos',
  assignments: 'assignment-submissions',
  offlineEvidence: 'offline-activity-evidence',
  paymentReceipts: 'payment-receipts',
  certificateTemplates: 'certificate-templates',
  generatedCertificates: 'generated-certificates',
} as const

export const LMS_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/webm',
  'application/zip',
]

export function safeObjectName(filename: string): string {
  const fallback = 'upload.bin'
  const clean = (filename || fallback)
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
  return clean || fallback
}

export function validateLmsFile(
  file: File,
  options: { allowedMimeTypes?: string[]; maxBytes?: number } = {}
) {
  const maxBytes = options.maxBytes ?? 100 * 1024 * 1024
  const allowedMimeTypes = options.allowedMimeTypes ?? LMS_ALLOWED_MIME_TYPES
  if (!file || file.size <= 0) throw new Error('Choose a file to upload')
  if (file.size > maxBytes) throw new Error(`File must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller`)
  if (file.type && !allowedMimeTypes.includes(file.type)) throw new Error('This file type is not allowed')
}

export async function uploadLmsFile(
  bucket: string,
  file: File,
  prefix: string,
  options: { allowedMimeTypes?: string[]; maxBytes?: number } = {}
) {
  validateLmsFile(file, options)
  const supabase = await createServiceClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const path = `${prefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${crypto.randomUUID()}-${safeObjectName(file.name)}`
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return {
    bucket,
    path,
    filename: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size,
  }
}

export async function getSignedCourseResourceUrl(resource: CourseResource, userId: string) {
  if (!resource.storage_bucket || !resource.storage_path) {
    return { success: false as const, error: 'Resource file is not attached' }
  }

  if (resource.visibility !== 'public') {
    const enrollment = await getUserEnrollment(userId, resource.course_id)
    if (!isEnrollmentActive(enrollment)) {
      return { success: false as const, error: 'Your course access is not active' }
    }
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from(resource.storage_bucket)
    .createSignedUrl(resource.storage_path, 60 * 5)

  if (error || !data?.signedUrl) {
    return { success: false as const, error: error?.message ?? 'Unable to create resource link' }
  }

  return { success: true as const, url: data.signedUrl }
}
