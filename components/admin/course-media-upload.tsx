'use client'

import { useId, useMemo, useState } from 'react'
import { ImageIcon, Loader2, Trash2, Upload, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { friendlyErrorMessage } from '@/lib/friendly-error'

type MediaKind = 'image' | 'video' | 'media'

interface CourseMediaUploadProps {
  name?: string
  label: string
  value?: string | null
  defaultValue?: string | null
  onChange?: (url: string) => void
  folder?: string
  kind?: MediaKind
  placeholder?: string
  required?: boolean
  className?: string
}

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  image: 'image/*',
  video: 'video/mp4,video/webm,video/*',
  media: 'image/*,video/mp4,video/webm,video/*',
}

const MAX_BYTES_BY_KIND: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  media: 100 * 1024 * 1024,
}

function mediaKindFromUrl(url: string, fallback: MediaKind): MediaKind {
  if (fallback !== 'media') return fallback
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return 'video'
  return 'image'
}

function fileAllowed(file: File, kind: MediaKind) {
  if (kind === 'image') return file.type.startsWith('image/')
  if (kind === 'video') return file.type.startsWith('video/')
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

function megabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024))
}

export function CourseMediaUpload({
  name,
  label,
  value,
  defaultValue,
  onChange,
  folder = 'courses',
  kind = 'image',
  placeholder,
  required = false,
  className = '',
}: CourseMediaUploadProps) {
  const id = useId()
  const fileId = `${id}-file`
  const controlled = value !== undefined
  const [internalUrl, setInternalUrl] = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const url = controlled ? value ?? '' : internalUrl
  const previewKind = useMemo(() => mediaKindFromUrl(url, kind), [url, kind])

  function setUrl(nextUrl: string) {
    if (!controlled) setInternalUrl(nextUrl)
    onChange?.(nextUrl)
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!fileAllowed(file, kind)) {
      toast.error(kind === 'image' ? 'Please choose an image file.' : 'Please choose a supported media file.')
      e.target.value = ''
      return
    }
    const maxBytes = MAX_BYTES_BY_KIND[kind]
    if (file.size > maxBytes) {
      toast.error(`File is too large. Maximum size is ${megabytes(maxBytes)}MB.`)
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/admin/site-media/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error([data.error, data.advice].filter(Boolean).join(' '))

      setUrl(data.url)
      toast.success(file.type.startsWith('video/') ? 'Video uploaded' : 'Image uploaded')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Upload failed.'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          id={id}
          name={name}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={placeholder ?? (kind === 'video' ? 'Upload or paste video URL' : 'Upload or paste image URL')}
          required={required}
          className="rounded-xl"
        />
        <input
          id={fileId}
          type="file"
          accept={ACCEPT_BY_KIND[kind]}
          onChange={uploadFile}
          disabled={uploading}
          className="sr-only"
        />
        <Button type="button" variant="outline" className="rounded-xl aria-disabled:pointer-events-none aria-disabled:opacity-50" asChild>
          <label htmlFor={uploading ? undefined : fileId} aria-disabled={uploading} className="cursor-pointer">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading' : 'Upload'}
          </label>
        </Button>
      </div>

      {url ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC]">
            {previewKind === 'video' ? (
              <video src={url} controls className="aspect-video w-full bg-black object-contain" />
            ) : (
              <img src={url} alt="" className="aspect-video w-full object-cover" />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white" onClick={() => setUrl('')}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] px-3 py-2 text-xs text-slate-500">
          {kind === 'video' ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
          <span>{kind === 'video' ? 'No video selected' : 'No image selected'}</span>
        </div>
      )}
      <p className="text-xs leading-5 text-slate-500">
        {kind === 'image'
          ? 'Recommended: 1280 x 720 JPG, PNG or WebP, up to 10MB.'
          : `Supported upload size: up to ${megabytes(MAX_BYTES_BY_KIND[kind])}MB.`}
      </p>
    </div>
  )
}
