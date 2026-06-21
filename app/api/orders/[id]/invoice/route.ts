import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { buildInvoiceHtml } from '@/lib/invoice'
import { getInvoiceTemplate } from '@/lib/site-content'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (order.user_id !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const template = await getInvoiceTemplate()
  const html = buildInvoiceHtml(order as never, template)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoice-${order.invoice_number ?? id.slice(0, 8)}.html"`,
    },
  })
}
