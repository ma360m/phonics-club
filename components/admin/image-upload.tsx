'use client'

import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { friendlyErrorMessage } from '@/lib/friendly-error'

interface ImageUploadProps {
  onUpload: (url: string) => void
  folder?: string
  /** Use Supabase Storage (`/api/admin/products/upload-image`) instead of Cloudinary */
  storage?: boolean
  /** Attach uploaded image to product by ISBN (Supabase Storage only) */
  isbn?: string
  multiple?: boolean
  uploadEndpoint?: string
}

export function ImageUpload({
  onUpload,
  folder = 'phonics-club',
  storage = false,
  isbn,
  multiple = false,
  uploadEndpoint,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        if (storage || uploadEndpoint) {
          if (isbn) formData.append('isbn', isbn)
          if (folder) formData.append('folder', folder)
          const res = await fetch(uploadEndpoint ?? '/api/admin/products/upload-image', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Upload failed')
          onUpload(data.url)
        } else {
          formData.append('folder', folder)
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Upload failed')
          onUpload(data.url)
        }
      }
      toast.success(
        files.length > 1
          ? `${files.length} images uploaded${isbn ? ' and attached to product' : ''}`
          : isbn
            ? 'Image uploaded and attached to product'
            : 'Image uploaded'
      )
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Upload failed.'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="file" accept="image/*" multiple={multiple} onChange={handleUpload} disabled={uploading} className="rounded-xl" />
      <Button type="button" variant="outline" disabled={uploading} className="rounded-xl shrink-0" asChild>
        <label className="cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </label>
      </Button>
    </div>
  )
}
