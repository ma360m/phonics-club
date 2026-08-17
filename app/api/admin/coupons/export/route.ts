import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

type ExportType = 'all' | 'coupons' | 'member-discounts'

type DiscountExportRow = {
  type: string
  code: string
  description: string
  discountPercent: number | string
  discountAmount: number | string
  shippingWaived: string
  usedCount: number | string
  maxUses: number | string
  active: string
  expiresAt: string
  invoices: string
  createdAt: string
}

type OrderReference = {
  id?: string | null
  invoice_number?: string | null
  coupon_code?: string | null
  member_id?: string | null
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function normalizeKey(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

function collectInvoices(orders: OrderReference[], key: string, column: 'coupon_code' | 'member_id') {
  return orders
    .filter((order) => normalizeKey(order[column]) === key)
    .map((order) => order.invoice_number || order.id || '')
    .filter(Boolean)
    .join('; ')
}

function rowsToCsv(rows: DiscountExportRow[]) {
  const headers = [
    'Type',
    'Code / Member ID',
    'Description',
    'Discount Percent',
    'Discount Amount',
    'Shipping Waived',
    'Used Count',
    'Max Uses',
    'Active',
    'Expires At',
    'Invoices',
    'Created At',
  ]
  const lines = rows.map((row) => [
    row.type,
    row.code,
    row.description,
    row.discountPercent,
    row.discountAmount,
    row.shippingWaived,
    row.usedCount,
    row.maxUses,
    row.active,
    row.expiresAt,
    row.invoices,
    row.createdAt,
  ].map(escapeCsv).join(','))

  return [headers.map(escapeCsv).join(','), ...lines].join('\n')
}

export async function GET(request: Request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const requestedType = searchParams.get('type')
  const exportType: ExportType =
    requestedType === 'coupons' || requestedType === 'member-discounts' ? requestedType : 'all'

  const supabase = await createClient()
  const [couponsResult, memberDiscountsResult, ordersResult] = await Promise.all([
    exportType !== 'member-discounts'
      ? supabase.from('coupons').select('*').order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    exportType !== 'coupons'
      ? supabase.from('member_discounts').select('*').order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from('orders').select('id, invoice_number, coupon_code, member_id'),
  ])

  const error = couponsResult.error || memberDiscountsResult.error || ordersResult.error
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orders = (ordersResult.data ?? []) as OrderReference[]
  const rows: DiscountExportRow[] = []

  for (const coupon of couponsResult.data ?? []) {
    const code = normalizeKey(coupon.code)
    rows.push({
      type: 'Coupon',
      code,
      description: String(coupon.description ?? ''),
      discountPercent: coupon.discount_percent ?? '',
      discountAmount: coupon.discount_amount ?? '',
      shippingWaived: '',
      usedCount: coupon.used_count ?? 0,
      maxUses: coupon.max_uses ?? 'Unlimited',
      active: coupon.active === false ? 'No' : 'Yes',
      expiresAt: coupon.expires_at ?? '',
      invoices: collectInvoices(orders, code, 'coupon_code'),
      createdAt: coupon.created_at ?? '',
    })
  }

  for (const memberDiscount of memberDiscountsResult.data ?? []) {
    const memberId = normalizeKey(memberDiscount.member_id)
    rows.push({
      type: 'Member ID Discount',
      code: memberId,
      description: '',
      discountPercent: memberDiscount.discount_percent ?? '',
      discountAmount: memberDiscount.discount_amount ?? '',
      shippingWaived: memberDiscount.free_shipping_enabled ? 'Yes' : 'No',
      usedCount: memberDiscount.used_count ?? 0,
      maxUses: memberDiscount.max_uses ?? 'Unlimited',
      active: memberDiscount.active === false ? 'No' : 'Yes',
      expiresAt: memberDiscount.expires_at ?? '',
      invoices: collectInvoices(orders, memberId, 'member_id'),
      createdAt: memberDiscount.created_at ?? '',
    })
  }

  const csv = rowsToCsv(rows)
  const date = new Date().toISOString().slice(0, 10)
  const suffix = exportType === 'all' ? 'discounts' : exportType

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="phonics-club-${suffix}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
