import { createHash, randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

export interface FastInvoiceLink {
  id: string
  token_hash: string
  label: string | null
  recipient_email: string | null
  required_member_id: string | null
  expires_at: string | null
  max_uses: number | null
  used_count: number
  active: boolean
  created_at: string
}

export function generateFastInvoiceToken() {
  return randomBytes(32).toString('hex')
}

export function hashFastInvoiceToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function isFastInvoiceLinkUsable(link: FastInvoiceLink | null) {
  if (!link || link.active === false) return false
  if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) return false
  if (link.max_uses && Number(link.used_count ?? 0) >= Number(link.max_uses)) return false
  return true
}

export async function getFastInvoiceLinkByToken(token: string) {
  const cleanToken = token.trim()
  if (!cleanToken) return null

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('fast_invoice_links')
    .select('*')
    .eq('token_hash', hashFastInvoiceToken(cleanToken))
    .maybeSingle()

  return (data as FastInvoiceLink | null) ?? null
}
