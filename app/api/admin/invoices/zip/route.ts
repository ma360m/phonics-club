import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { invoiceCustomerName, invoiceFileBaseName } from '@/lib/invoice'
import { getInvoiceTemplate } from '@/lib/site-content'
import { createZip } from '@/lib/zip'
import type { Order } from '@/types/database'

const FINAL_STATUSES = new Set(['payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered'])

function isFinalized(order: Order) {
  return Boolean(order.finalized_at) || (order.document_type !== 'estimate' && FINAL_STATUSES.has(order.status))
}

export async function GET(request: Request) {
  await requireAdmin()
  const month = new URL(request.url).searchParams.get('month')?.trim() ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Choose a valid invoice month.' }, { status: 400 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: 'Invoices could not be loaded.' }, { status: 500 })

  const orders = ((data ?? []) as Order[]).filter((order) => isFinalized(order) && (order.finalized_at ?? order.created_at).slice(0, 7) === month)
  if (!orders.length) return NextResponse.json({ error: 'No finalized invoices found for this month.' }, { status: 404 })

  const template = await getInvoiceTemplate()
  const entries = []
  const usedNames = new Set<string>()
  for (const order of orders) {
    const pdf = await buildInvoicePdf(order as never, template)
    const baseName = invoiceFileBaseName(order.invoice_number ?? 'INV', invoiceCustomerName(order as never))
    let fileName = `${baseName}.pdf`
    let suffix = 2
    while (usedNames.has(fileName)) fileName = `${baseName}_${suffix++}.pdf`
    usedNames.add(fileName)
    entries.push({ name: fileName, data: pdf })
  }

  const zip = createZip(entries)
  return new NextResponse(zip as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="invoices-${month}.zip"`,
      'Cache-Control': 'no-store',
    },
  })
}
