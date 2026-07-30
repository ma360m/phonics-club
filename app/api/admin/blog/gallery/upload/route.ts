import { NextResponse } from 'next/server'
import { getProfile, isAdminRole } from '@/lib/auth'
import { uploadBlogGalleryImageToStorage } from '@/lib/supabase/storage'
import { friendlyErrorMessage } from '@/lib/friendly-error'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || !isAdminRole(profile.role)) {
    return NextResponse.json({ error: 'You must be signed in as an admin before uploading blog gallery images.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Choose an image before uploading.' }, { status: 400 })

    const contentType = file.type || 'application/octet-stream'
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Use JPG, PNG, WebP, or GIF images for blog galleries.' }, { status: 400 })
    }

    const maxMb = Number(process.env.ADMIN_BLOG_GALLERY_UPLOAD_MAX_MB ?? 10)
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Image exceeds the ${maxMb}MB limit.` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadBlogGalleryImageToStorage(buffer, file.name, contentType)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Blog gallery upload error:', error)
    return NextResponse.json({ error: friendlyErrorMessage(error, 'Blog gallery upload failed.') }, { status: 500 })
  }
}
