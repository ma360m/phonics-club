import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getProfile, isAdminRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { uploadProductImageToStorage } from '@/lib/supabase/storage'
import { friendlyErrorMessage } from '@/lib/friendly-error'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || !isAdminRole(profile.role)) {
    return NextResponse.json({ error: 'You must be signed in as an admin before uploading product images.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const isbn = formData.get('isbn') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Choose an image file before uploading.' }, { status: 400 })
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
        return NextResponse.json({ error: friendlyErrorMessage(error, 'Product image was uploaded, but the product could not be updated.') }, { status: 500 })
      }

      revalidatePath('/admin/products')
      revalidatePath('/shop')
    }

    return NextResponse.json({ url, path, isbn })
  } catch (err) {
    console.error('Storage upload error:', err)
    return NextResponse.json(
      { error: friendlyErrorMessage(err, 'Product image upload failed.') },
      { status: 500 }
    )
  }
}
