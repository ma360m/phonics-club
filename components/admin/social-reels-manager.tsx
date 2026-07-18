'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { saveSiteContentAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { SocialReel } from '@/lib/site-content'

function newReel(): SocialReel {
  return {
    id: crypto.randomUUID(),
    title: '',
    thumbnail: '',
    videoUrl: '',
  }
}

export function SocialReelsManager({ reels }: { reels: SocialReel[] }) {
  const [items, setItems] = useState<SocialReel[]>(reels.length ? reels : [newReel()])
  const [pending, startTransition] = useTransition()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  function update(index: number, patch: Partial<SocialReel>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function uploadFor(index: number, field: 'thumbnail' | 'videoUrl', file: File) {
    const key = `${index}-${field}`
    setUploadingKey(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'homepage-reels')
      const res = await fetch('/api/admin/site-media/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      update(index, { [field]: data.url })
      toast.success(field === 'videoUrl' ? 'Reel video uploaded' : 'Thumbnail uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingKey(null)
    }
  }

  function save() {
    startTransition(async () => {
      const cleanItems = items
        .map((item, index) => ({
          id: item.id || String(index + 1),
          title: item.title.trim() || `Community reel ${index + 1}`,
          thumbnail: item.thumbnail.trim(),
          videoUrl: item.videoUrl.trim(),
        }))
        .filter((item) => item.title || item.thumbnail || item.videoUrl)

      const result = await saveSiteContentAction('social_reels', cleanItems)
      if (result.success) toast.success('Social reels saved')
      else toast.error(result.error ?? 'Could not save social reels')
    })
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Homepage Community Reels</h2>
          <p className="text-sm text-muted-foreground">Upload reel videos and thumbnails shown in the Join Our Community section above the footer.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => setItems((current) => [...current, newReel()])}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reel
        </Button>
      </div>

      <div className="mt-5 space-y-5">
        {items.map((item, index) => (
          <div key={item.id || index} className="rounded-lg border bg-background p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={item.title} onChange={(event) => update(index, { title: event.target.value })} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={item.thumbnail} onChange={(event) => update(index, { thumbnail: event.target.value })} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input value={item.videoUrl} onChange={(event) => update(index, { videoUrl: event.target.value })} className="rounded-lg" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                {uploadingKey === `${index}-thumbnail` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upload Thumbnail
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={Boolean(uploadingKey)}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) uploadFor(index, 'thumbnail', file)
                    event.target.value = ''
                  }}
                />
              </label>
              <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                {uploadingKey === `${index}-videoUrl` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upload Reel Video
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  disabled={Boolean(uploadingKey)}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) uploadFor(index, 'videoUrl', file)
                    event.target.value = ''
                  }}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg text-destructive hover:text-destructive"
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" disabled={pending} onClick={save} className="mt-5 rounded-lg bg-[#1D4ED8]">
        {pending ? 'Saving...' : 'Save Reels'}
      </Button>
    </section>
  )
}
