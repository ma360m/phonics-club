import { NextResponse } from 'next/server'
import { deleteShopCatalog, listShopCatalogs, saveShopCatalog } from '@/lib/shop-catalogs'
import { getProfile } from '@/lib/auth'

export async function GET() {
  const catalogs = await listShopCatalogs()
  return NextResponse.json({ catalogs })
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const formData = await request.formData()
  const methodOverride = String(formData.get('_method') ?? '').toLowerCase()
  if (methodOverride === 'delete') {
    const name = String(formData.get('name') ?? '')
    if (!name) {
      return NextResponse.json({ error: 'Missing catalog name' }, { status: 400 })
    }

    await deleteShopCatalog(name)
    return NextResponse.redirect(new URL('/admin/catalogs', request.url))
  }

  const file = formData.get('file')
  const label = formData.get('label')
  if (!file || typeof file === 'string' || !file.name) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const catalog = await saveShopCatalog(file, label === 'local' ? 'local' : 'uk')
  return NextResponse.redirect(new URL('/admin/catalogs', request.url))
}

export async function DELETE(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) {
    return NextResponse.json({ error: 'Missing catalog name' }, { status: 400 })
  }

  await deleteShopCatalog(name)
  return NextResponse.redirect(new URL('/admin/catalogs', request.url))
}
