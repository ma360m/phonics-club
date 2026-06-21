'use client'

import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ImageUploadProps {
  onUpload: (url: string) => void
  folder?: string
  /** Use Supabase Storage (`/api/admin/products/upload-image`) instead of Cloudinary */
  storage?: boolean
  /** Attach uploaded image to product by ISBN (Supabase Storage only) */
  isbn?: string
}

export function ImageUpload({
  onUpload,
  folder = 'phonics-club',
  storage = false,
  isbn,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      if (storage) {
        if (isbn) formData.append('isbn', isbn)
        const res = await fetch('/api/admin/products/upload-image', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        onUpload(data.url)
        toast.success(isbn ? 'Image uploaded and attached to product' : 'Image uploaded to Supabase Storage')
      } else {
        formData.append('folder', folder)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        onUpload(data.url)
        toast.success('Image uploaded')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="rounded-xl" />
      <Button type="button" variant="outline" disabled={uploading} className="rounded-xl shrink-0" asChild>
        <label className="cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </label>
      </Button>
    </div>
  )
}
