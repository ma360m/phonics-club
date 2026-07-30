import { NextResponse } from 'next/server'
import { customerRowsToCsv, getAdminCustomerRows } from '@/lib/admin/customers'

export async function GET() {
  const rows = await getAdminCustomerRows()
  const csv = customerRowsToCsv(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="phonics-club-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
