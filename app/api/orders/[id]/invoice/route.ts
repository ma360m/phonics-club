import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession, isAdminRole } from '@/lib/auth'
import { buildInvoiceHtml, invoiceCustomerName, invoiceFileBaseName } from '@/lib/invoice'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { getInvoiceTemplate } from '@/lib/site-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const editToken = searchParams.get('editToken')
  const format = searchParams.get('format') ?? 'html'

  const serviceSupabase = await createServiceClient()
  const { data: order, error } = await serviceSupabase.from('orders').select('*').eq('id', id).single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const user = await getSession()
  let authorized = false

  const editTokenValid =
    editToken &&
    order.customer_edit_token &&
    editToken === order.customer_edit_token &&
    order.customer_edit_allowed_until &&
    new Date(order.customer_edit_allowed_until).getTime() > Date.now()

  if (token && order.access_token && token === order.access_token) {
    authorized = true
  } else if (editTokenValid) {
    authorized = true
  } else if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (order.user_id === user.id || isAdminRole(profile?.role)) authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await getInvoiceTemplate()
  const invoiceNo = order.invoice_number ?? id.slice(0, 8)
  const invoiceFileName = invoiceFileBaseName(invoiceNo, invoiceCustomerName(order as never))

  if (format === 'pdf') {
    const pdfBytes = await buildInvoicePdf(order as never, template)
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceFileName}.pdf"`,
      },
    })
  }

  const html = buildInvoiceHtml(order as never, template)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${invoiceFileName}.html"`,
    },
  })
}
