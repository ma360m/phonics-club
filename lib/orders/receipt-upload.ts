import { createServiceClient } from '@/lib/supabase/server'
import { toError } from '@/lib/friendly-error'

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['application/pdf', 'pdf'],
])

export interface OrderReceiptUpload {
  bucket: string
  path: string
  filename: string
  mimeType: string
  sizeBytes: number
}

function validateOrderReceipt(file: File) {
  const extension = ALLOWED_RECEIPT_TYPES.get(file.type)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is missing', 'Receipt upload failed.')
  }
  if (file.size <= 0) {
    throw toError('No receipt file was selected', 'Receipt upload failed.')
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw toError('Receipt file is larger than 10 MB', 'Receipt upload failed.')
  }
  if (!extension) {
    throw toError('Receipt must be a JPG, PNG, or PDF file', 'Receipt upload failed.')
  }
  const lowerName = file.name.toLowerCase()
  if (!['.jpg', '.jpeg', '.png', '.pdf'].some((suffix) => lowerName.endsWith(suffix))) {
    throw toError('Receipt file extension is not allowed', 'Receipt upload failed.')
  }
  return extension
}

export async function uploadOrderReceiptFile(file: File, prefix: string): Promise<OrderReceiptUpload> {
  const ext = validateOrderReceipt(file)
  const supabase = await createServiceClient()
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9/_-]/g, '-')
  const path = `${normalizedPrefix}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('order-receipts')
    .upload(path, buffer, { contentType: file.type || 'image/jpeg' })

  if (error) throw toError(error, 'Receipt upload failed.')

  return {
    bucket: 'order-receipts',
    path,
    filename: file.name.replace(/[/\\]/g, '-').slice(0, 180),
    mimeType: file.type,
    sizeBytes: file.size,
  }
}

export async function uploadOrderReceipt(file: File, userId: string): Promise<string> {
  const uploaded = await uploadOrderReceiptFile(file, `orders/legacy/${userId}`)
  return `private://order-receipts/${uploaded.path}`
}
