import { createServiceClient } from '@/lib/supabase/server'
import { generateInvoiceNumber } from '@/lib/invoice'

function errorSearchText(error: unknown) {
  if (!error || typeof error !== 'object') return String(error ?? '').toLowerCase()
  const record = error as Record<string, unknown>
  return [record.code, record.message, record.details, record.hint, record.constraint]
    .map((value) => String(value ?? ''))
    .join(' ')
    .toLowerCase()
}

export function isDuplicateInvoiceNumberError(error: unknown) {
  const text = errorSearchText(error)
  return (text.includes('23505') || text.includes('duplicate') || text.includes('already exists')) &&
    (text.includes('invoice_number') || text.includes('invoice number') || text.includes('orders_invoice_number_key'))
}

export async function getNextInvoiceNumber(): Promise<string> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('next_invoice_number' as never, {
      p_invoice_date: new Date().toISOString().slice(0, 10),
    } as never)
    if (error || !data) {
      if (error) console.error('[Invoice numbering] Could not get next invoice number:', error.message)
      return generateInvoiceNumber()
    }
    return String(data)
  } catch (error) {
    console.error('[Invoice numbering] Falling back to local invoice number:', error)
    return generateInvoiceNumber()
  }
}
