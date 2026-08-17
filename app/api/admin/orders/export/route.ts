import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllOrders } from '@/lib/data/queries'
import { adminOrdersToCsv, orderMatchesAdminSearch } from '@/lib/admin/orders'

export async function GET(request: Request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const orders = await getAllOrders()
  const visibleOrders = searchQuery
    ? orders.filter((order) => orderMatchesAdminSearch(order, searchQuery))
    : orders

  const csv = adminOrdersToCsv(visibleOrders)
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="phonics-club-orders-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
