import { createServiceClient } from '@/lib/supabase/server'

export async function uploadOrderReceipt(file: File, userId: string): Promise<string> {
  const supabase = await createServiceClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `receipts/${userId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('order-receipts')
    .upload(path, buffer, { contentType: file.type || 'image/jpeg' })

  if (error) throw new Error(error.message)

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/order-receipts/${path}`
}
