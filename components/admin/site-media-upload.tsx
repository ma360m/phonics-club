'use client'

import { useState } from 'react'
import { Copy, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { friendlyErrorMessage } from '@/lib/friendly-error'

export function SiteMediaUpload({
  label = 'Upload supporting media',
  accept = 'image/*,video/*',
  folder = 'site-content',
  onUploaded,
}: {
  label?: string
  accept?: string
  folder?: string
  onUploaded?: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      const res = await fetch('/api/admin/site-media/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUrl(data.url)
      onUploaded?.(data.url)
      toast.success('Media uploaded')
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Input
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleFile(file)
            event.target.value = ''
          }}
        />
        {url ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => {
              navigator.clipboard.writeText(url)
              toast.success('URL copied')
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
        ) : (
          <Button type="button" variant="outline" className="rounded-lg" disabled>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading' : 'Upload'}
          </Button>
        )}
      </div>
      {url ? <p className="mt-3 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{url}</p> : null}
    </div>
  )
}
