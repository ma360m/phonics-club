import { NextResponse } from 'next/server'
import { getProfile, isLmsManagerRole } from '@/lib/auth'
import { uploadSiteMediaToStorage } from '@/lib/supabase/storage'
import { friendlyErrorMessage } from '@/lib/friendly-error'

const ALLOWED_PREFIXES = ['image/', 'video/']

function uploadAdvice(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('service_role') || lower.includes('admin access')) {
    return 'Ask the site admin to add SUPABASE_SERVICE_ROLE_KEY in Vercel and .env.local, then restart or redeploy.'
  }
  if (lower.includes('bucket') || lower.includes('storage')) {
    return 'Check that the site-media bucket exists in Supabase Storage and that the latest storage policies have been applied.'
  }
  if (lower.includes('large') || lower.includes('limit') || lower.includes('mb')) {
    return 'Compress the file, upload a smaller file, or increase ADMIN_MEDIA_UPLOAD_MAX_MB for admin uploads.'
  }
  if (lower.includes('type') || lower.includes('supported')) {
    return 'Use JPG, PNG, WebP, MP4 or WebM. For PDFs/resources, upload them in the course resources section.'
  }
  return 'Try again after checking your connection. If it repeats, copy this message and check the server logs for the exact upload error.'
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || !isLmsManagerRole(profile.role)) {
    return NextResponse.json(
      {
        error: 'You must be signed in as an approved admin or instructor before uploading course media.',
        advice: 'Ask an admin to approve your account as an instructor from Admin > Users.',
      },
      { status: 401 },
    )
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
      const error = friendlyErrorMessage('Only image and video uploads are supported')
      return NextResponse.json({ error, advice: uploadAdvice(error) }, { status: 400 })
    }

    const maxMb = Number(process.env.ADMIN_MEDIA_UPLOAD_MAX_MB ?? 100)
    if (file.size > maxMb * 1024 * 1024) {
      const error = friendlyErrorMessage(`File exceeds ${maxMb}MB limit`)
      return NextResponse.json({ error, advice: uploadAdvice(error) }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadSiteMediaToStorage(buffer, file.name, contentType, folder)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Site media upload error:', err)
    const error = friendlyErrorMessage(err, 'Media upload failed.')
    return NextResponse.json(
      { error, advice: uploadAdvice(error) },
      { status: 500 }
    )
  }
}
