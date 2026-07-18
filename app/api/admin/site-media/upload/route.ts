import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { uploadSiteMediaToStorage } from '@/lib/supabase/storage'
import { friendlyErrorMessage } from '@/lib/friendly-error'

const ALLOWED_PREFIXES = ['image/', 'video/']

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'You must be signed in as an admin before uploading course media.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = String(formData.get('folder') ?? 'site-content')

    if (!file) {
      return NextResponse.json({ error: 'Choose an image or video file before uploading.' }, { status: 400 })
    }

    const contentType = file.type || 'application/octet-stream'
    if (!ALLOWED_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      return NextResponse.json({ error: friendlyErrorMessage('Only image and video uploads are supported') }, { status: 400 })
    }

    const maxMb = Number(process.env.ADMIN_MEDIA_UPLOAD_MAX_MB ?? 100)
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: friendlyErrorMessage(`File exceeds ${maxMb}MB limit`) }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadSiteMediaToStorage(buffer, file.name, contentType, folder)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Site media upload error:', err)
    return NextResponse.json(
      { error: friendlyErrorMessage(err, 'Media upload failed.') },
      { status: 500 }
    )
  }
}
