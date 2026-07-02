import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { parseCsv, parseImportRowsFromObjects } from '@/lib/products/import-export'
import { parseXlsxImport } from '@/lib/products/xlsx'
import { upsertProductsByIsbn } from '@/lib/products/upsert'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const replaceCatalog = formData.get('replace') === 'true'
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    const buffer = await file.arrayBuffer()

    let rows
    let skipped = 0

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const parsed = parseXlsxImport(buffer)
      rows = parsed.rows
      skipped = parsed.skipped
    } else if (name.endsWith('.csv')) {
      const text = new TextDecoder().decode(buffer)
      const objects = parseCsv(text)
      const parsed = parseImportRowsFromObjects(objects)
      rows = parsed.rows
      skipped = parsed.skipped
    } else {
      return NextResponse.json({ error: 'Unsupported format. Use .csv or .xlsx' }, { status: 400 })
    }

    if (!rows.length) {
      return NextResponse.json(
        { error: 'No valid rows found. ISBN and name are required columns.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let deleted = 0

    if (replaceCatalog) {
      const { error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      deleted = count ?? 0
    }

    const result = await upsertProductsByIsbn(supabase, rows)

    revalidatePath('/admin/products')
    revalidatePath('/shop')

    return NextResponse.json({
      success: true,
      ...result,
      deleted,
      skipped,
      total: rows.length,
      message: replaceCatalog
        ? `Catalog replaced: ${deleted} deleted, ${result.created} created, ${result.updated} updated, ${result.failed} failed, ${skipped} rows skipped.`
        : `Import complete: ${result.created} created, ${result.updated} updated, ${result.failed} failed, ${skipped} rows skipped.`,
    })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    )
  }
}
