import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { uploadProductImageToStorage } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const isbn = formData.get('isbn') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, path } = await uploadProductImageToStorage(
      buffer,
      file.name,
      file.type || 'image/jpeg'
    )

    if (isbn) {
      const supabase = await createClient()
      const { data: product } = await supabase
        .from('products')
        .select('images')
        .eq('isbn', isbn)
        .single()

      const existingImages = (product?.images as string[]) ?? []
      const { error } = await supabase
        .from('products')
        .update({ images: [...existingImages, url] } as never)
        .eq('isbn', isbn)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      revalidatePath('/admin/products')
      revalidatePath('/shop')
    }

    return NextResponse.json({ url, path, isbn })
  } catch (err) {
    console.error('Storage upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
