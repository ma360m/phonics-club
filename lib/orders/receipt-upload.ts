import { createServiceClient } from '@/lib/supabase/server'
import { toError } from '@/lib/friendly-error'

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf'])

export async function uploadOrderReceipt(file: File, userId: string): Promise<string> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is missing', 'Receipt upload failed.')
  }
  if (file.size <= 0) {
    throw toError('No receipt file was selected', 'Receipt upload failed.')
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw toError('Receipt file is larger than 10 MB', 'Receipt upload failed.')
  }
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    throw toError('Receipt must be a JPG, PNG, or PDF file', 'Receipt upload failed.')
  }

  const supabase = await createServiceClient()
  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const path = `receipts/${userId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('order-receipts')
    .upload(path, buffer, { contentType: file.type || 'image/jpeg' })

  if (error) throw toError(error, 'Receipt upload failed.')

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/order-receipts/${path}`
}
