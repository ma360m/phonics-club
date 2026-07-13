import { createServiceClient } from '@/lib/supabase/server'
import { generateInvoiceNumber } from '@/lib/invoice'

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
