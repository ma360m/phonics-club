'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { saveSiteContentAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import type { AboutPageContent, ContentImage } from '@/lib/site-content'

function createGalleryImage(): ContentImage {
  return {
    src: '',
    alt: '',
    caption: '',
  }
}

export function AboutGalleryManager({ content }: { content: AboutPageContent }) {
  const [images, setImages] = useState<ContentImage[]>(content.galleryImages?.length ? content.galleryImages : [createGalleryImage()])
  const [pending, startTransition] = useTransition()
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  function updateImage(index: number, patch: Partial<ContentImage>) {
    setImages((current) => current.map((image, imageIndex) => (imageIndex === index ? { ...image, ...patch } : image)))
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'about-gallery')
      const response = await fetch('/api/admin/site-media/upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      updateImage(index, { src: data.url })
      toast.success('Gallery image uploaded')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Gallery image upload failed.'))
    } finally {
      setUploadingIndex(null)
    }
  }

  function save() {
    startTransition(async () => {
      const cleanImages = images
        .map((image, index) => ({
          src: image.src.trim(),
          alt: image.alt.trim() || `Phonics Club gallery image ${index + 1}`,
          caption: image.caption?.trim() || undefined,
        }))
        .filter((image) => image.src)

      const result = await saveSiteContentAction('about_page', {
        ...content,
        galleryImages: cleanImages,
      })

      if (result.success) toast.success('About gallery saved')
      else toast.error(friendlyErrorMessage(result.error, 'Could not save About gallery.'))
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label className="text-lg font-semibold">About Page Gallery</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Add, delete, and upload the images shown in the collapsible About page gallery.
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setImages((current) => [...current, createGalleryImage()])}>
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </div>

      <div className="space-y-3">
        {images.map((image, index) => (
          <div key={`${image.src}-${index}`} className="grid gap-3 rounded-xl border bg-background/60 p-3 lg:grid-cols-[1.35fr_1fr_1fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Image URL or path</Label>
              <Input
                value={image.src}
                onChange={(event) => updateImage(index, { src: event.target.value })}
                placeholder="/images/gallery/photo.jpg or https://..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alt text</Label>
              <Input
                value={image.alt}
                onChange={(event) => updateImage(index, { alt: event.target.value })}
                placeholder="Describe the image"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Caption</Label>
              <Input
                value={image.caption ?? ''}
                onChange={(event) => updateImage(index, { caption: event.target.value })}
                placeholder="Optional"
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border px-3 text-sm hover:bg-muted">
                {uploadingIndex === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingIndex !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) uploadImage(index, file)
                    event.target.value = ''
                  }}
                />
              </label>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-xl"
                onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                aria-label={`Remove gallery image ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" disabled={pending} onClick={save} className="rounded-xl bg-[#1D4ED8]">
        {pending ? 'Saving...' : 'Save About Gallery'}
      </Button>
    </section>
  )
}
