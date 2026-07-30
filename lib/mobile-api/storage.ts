import { createServiceClient } from '@/lib/supabase/server'
import { safeObjectName } from '@/lib/lms-storage'
import { MobileApiError } from './response'

const RECEIPT_BUCKET = 'order-receipts'
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024

const RECEIPT_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export interface MobileReceiptUpload {
  bucket: string
  path: string
  filename: string
  mimeType: string
  sizeBytes: number
}

export function validateMobileReceiptFile(file: File) {
  if (!file || file.size <= 0) {
    throw new MobileApiError('FILE_REQUIRED', 'Choose a receipt file to upload.', 400)
  }

  if (file.size > MAX_RECEIPT_BYTES) {
    throw new MobileApiError('FILE_TOO_LARGE', 'Receipt files must be 10 MB or smaller.', 413)
  }

  const extension = RECEIPT_TYPES.get(file.type)
  if (!extension) {
    throw new MobileApiError('FILE_TYPE_NOT_ALLOWED', 'Upload a PDF, JPG, PNG, or WebP receipt.', 415)
  }

  const lowerName = file.name.toLowerCase()
  const hasValidExtension = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].some((suffix) => lowerName.endsWith(suffix))
  if (!hasValidExtension) {
    throw new MobileApiError('FILE_EXTENSION_NOT_ALLOWED', 'Receipt file extension is not allowed.', 415)
  }

  return extension
}

export async function uploadPrivateReceiptFile(input: {
  file: File
  bucket?: string
  pathPrefix: string
}) {
  const extension = validateMobileReceiptFile(input.file)
  const bucket = input.bucket ?? RECEIPT_BUCKET
  const supabase = await createServiceClient()
  const normalizedPrefix = input.pathPrefix.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9/_-]/g, '-')
  const path = `${normalizedPrefix}/${crypto.randomUUID()}.${extension}`
  const buffer = Buffer.from(await input.file.arrayBuffer())

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: input.file.type,
    upsert: false,
  })

  if (error) {
    throw new MobileApiError('RECEIPT_UPLOAD_FAILED', 'Receipt upload failed. Please try again.', 500)
  }

  return {
    bucket,
    path,
    filename: safeObjectName(input.file.name),
    mimeType: input.file.type,
    sizeBytes: input.file.size,
  } satisfies MobileReceiptUpload
}

export async function createPrivateSignedUrl(bucket: string, path: string, expiresInSeconds = 300) {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new MobileApiError('SIGNED_URL_FAILED', 'The requested file is not available right now.', 500)
  }

  return {
    url: data.signedUrl,
    expiresIn: expiresInSeconds,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  }
}
