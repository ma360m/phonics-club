import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { productsToCsv } from '@/lib/products/import-export'
import { productsToXlsxBuffer } from '@/lib/products/xlsx'

export async function GET(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'csv'

  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const products = data ?? []
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'xlsx') {
    const buffer = productsToXlsxBuffer(products as Record<string, unknown>[])
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="phonics-club-products-${date}.xlsx"`,
      },
    })
  }

  const csv = productsToCsv(products as Record<string, unknown>[])
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="phonics-club-products-${date}.csv"`,
    },
  })
}
