import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession, isAdminRole } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const serviceSupabase = await createServiceClient()
  const { data: order, error } = await serviceSupabase
    .from('orders')
    .select('id, user_id, access_token, receipt_url, receipt_bucket, receipt_path')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const user = await getSession()
  let authorized = Boolean(token && order.access_token && token === order.access_token)

  if (!authorized && user) {
    const supabase = await createClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    authorized = order.user_id === user.id || isAdminRole(profile?.role)
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (order.receipt_bucket && order.receipt_path) {
    const { data, error: signedError } = await serviceSupabase.storage
      .from(order.receipt_bucket)
      .createSignedUrl(order.receipt_path, 60 * 5)

    if (signedError || !data?.signedUrl) {
      return NextResponse.json({ error: 'Receipt unavailable' }, { status: 404 })
    }

    return NextResponse.redirect(data.signedUrl)
  }

  const legacyPath = order.receipt_url?.match(/\/storage\/v1\/object\/public\/order-receipts\/(.+)$/)?.[1]
  if (legacyPath) {
    const { data, error: signedError } = await serviceSupabase.storage
      .from('order-receipts')
      .createSignedUrl(decodeURIComponent(legacyPath), 60 * 5)

    if (!signedError && data?.signedUrl) {
      return NextResponse.redirect(data.signedUrl)
    }
  }

  if (order.receipt_url && /^https?:\/\//i.test(order.receipt_url)) {
    return NextResponse.redirect(order.receipt_url)
  }

  return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
}
