import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { uploadImage, isCloudinaryConfigured } from '@/lib/cloudinary'
import { rateLimit } from '@/lib/rate-limit'
import { friendlyErrorMessage } from '@/lib/friendly-error'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'You must be signed in as an admin before uploading media.' }, { status: 401 })
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: friendlyErrorMessage('Cloudinary not configured') }, { status: 503 })
  }

  const rl = rateLimit(`upload:${profile.id}`, 20, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many uploads in one minute. Wait briefly, then try again.' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Choose an image file before uploading.' }, { status: 400 })
    }

    const maxMb = Number(process.env.ADMIN_UPLOAD_MAX_MB ?? 5)
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: friendlyErrorMessage(`File exceeds ${maxMb}MB limit`) }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const folder = String(formData.get('folder') ?? 'phonics-club')
    const result = await uploadImage(buffer, folder)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: friendlyErrorMessage(err, 'Upload failed.') }, { status: 500 })
  }
}
