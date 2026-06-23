import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { buildInvoiceHtml } from '@/lib/invoice'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { getInvoiceTemplate } from '@/lib/site-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const format = searchParams.get('format') ?? 'html'

  const supabase = await createClient()
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const user = await getSession()
  let authorized = false

  if (token && order.access_token && token === order.access_token) {
    authorized = true
  } else if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (order.user_id === user.id || profile?.role === 'admin') authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await getInvoiceTemplate()
  const invoiceNo = order.invoice_number ?? id.slice(0, 8)

  if (format === 'pdf') {
    const pdfBytes = await buildInvoicePdf(order as never, template)
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNo}.pdf"`,
      },
    })
  }

  const html = buildInvoiceHtml(order as never, template)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoice-${invoiceNo}.html"`,
    },
  })
}
