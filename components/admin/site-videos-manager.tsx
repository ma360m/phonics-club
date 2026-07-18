'use client'

import { useState, useTransition } from 'react'
import { ExternalLink, Loader2, Save, Trash2, Upload } from 'lucide-react'
import { saveSiteContentAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import type { WebsiteVideos } from '@/lib/site-content'

type VideoKey = keyof WebsiteVideos

const VIDEO_SLOTS: Array<{
  key: VideoKey
  label: string
  hint: string
  uploadFolder: string
}> = [
  {
    key: 'homeHeroVideoUrl',
    label: 'Homepage Hero Video',
    hint: 'Main video in the homepage hero. YouTube links and uploaded MP4/WebM files are supported.',
    uploadFolder: 'homepage-hero',
  },
  {
    key: 'homeHeroDemoUrl',
    label: 'Homepage Watch Demo Link',
    hint: 'The Watch Demo button target. This may be a YouTube link, uploaded video, or any public video URL.',
    uploadFolder: 'homepage-demo',
  },
  {
    key: 'readingSuccessVideoUrl',
    label: 'Student Progress Tile Video',
    hint: 'Video opened from the Student progress tile in the homepage community section. Clearing this leaves the tile as a normal icon card.',
    uploadFolder: 'reading-success',
  },
  {
    key: 'trainingsHeroVideoUrl',
    label: 'Trainings Hero Background Video',
    hint: 'Background video only behind the Professional Training hero and cards.',
    uploadFolder: 'training-hero',
  },
  {
    key: 'trainingsOnsiteVideoUrl',
    label: 'Onsite Training Video Panel',
    hint: 'Contained video banner above the Classroom Training onsite cards. Clearing this removes the panel.',
    uploadFolder: 'training-onsite',
  },
]

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)
}

export function SiteVideosManager({ videos }: { videos: WebsiteVideos }) {
  const [items, setItems] = useState<WebsiteVideos>(videos)
  const [pending, startTransition] = useTransition()
  const [uploadingKey, setUploadingKey] = useState<VideoKey | null>(null)

  function update(key: VideoKey, value: string) {
    setItems((current) => ({ ...current, [key]: value }))
  }

  async function uploadFor(slot: (typeof VIDEO_SLOTS)[number], file: File) {
    setUploadingKey(slot.key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', slot.uploadFolder)
      const res = await fetch('/api/admin/site-media/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      update(slot.key, data.url)
      toast.success(`${slot.label} uploaded`)
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Video upload failed.'))
    } finally {
      setUploadingKey(null)
    }
  }

  function save() {
    startTransition(async () => {
      const cleanVideos = Object.fromEntries(
        Object.entries(items).map(([key, value]) => [key, String(value ?? '').trim()])
      )
      const result = await saveSiteContentAction('site_videos', cleanVideos)
      if (result.success) toast.success('Website videos saved')
      else toast.error(friendlyErrorMessage(result.error, 'Could not save website videos.'))
    })
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Website Videos</h2>
          <p className="text-sm text-muted-foreground">
            Edit, upload, or remove videos used across the public website. Social reels and course lesson videos remain editable in their own admin sections.
          </p>
        </div>
        <Button type="button" disabled={pending} onClick={save} className="rounded-lg bg-[#1D4ED8]">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Videos
        </Button>
      </div>

      <div className="mt-5 space-y-5">
        {VIDEO_SLOTS.map((slot) => {
          const value = items[slot.key] ?? ''
          return (
            <div key={slot.key} className="rounded-lg border bg-background p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div className="space-y-2">
                  <Label>{slot.label}</Label>
                  <Input value={value} onChange={(event) => update(slot.key, event.target.value)} className="rounded-lg" />
                  <p className="text-xs text-muted-foreground">{slot.hint}</p>
                </div>
                <div className="overflow-hidden rounded-lg border bg-black">
                  {value && isDirectVideo(value) ? (
                    <video src={value} muted playsInline controls className="aspect-video h-full w-full object-contain" />
                  ) : value ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      className="flex aspect-video items-center justify-center gap-2 bg-muted px-3 text-center text-xs font-medium text-[#1D4ED8]"
                    >
                      Open video link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted text-xs text-muted-foreground">No video</div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                  {uploadingKey === slot.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Video
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    className="sr-only"
                    disabled={Boolean(uploadingKey)}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) uploadFor(slot, file)
                      event.target.value = ''
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-lg text-destructive hover:text-destructive"
                  onClick={() => update(slot.key, '')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
