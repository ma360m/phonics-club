'use client'

import { useActionState, useMemo, useState } from 'react'
import { createTrainerAction, deleteTrainerAction, updateTrainerAction } from '@/actions/admin/trainers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, ImagePlus, Link2, PlusCircle, Search, Trash2 } from 'lucide-react'
import { slugify } from '@/utils/slug'
import type { ActionResult } from '@/types'
import type { Trainer } from '@/types/database'
import type { TrainerProfileAttachment, TrainerProfileAttachments } from '@/lib/site-content'

const initial: ActionResult = { success: false }

interface TrainerArticleOption {
  slug: string
  title: string
  category: string
  created_at: string
}

function listToText(value?: string[] | null) {
  return (value ?? []).join('\n')
}

function trainerSlug(trainer: Partial<Trainer>) {
  return trainer.slug || (trainer.name ? slugify(trainer.name) : '')
}

function attachmentWithDefaults(attachment?: Partial<TrainerProfileAttachment>): TrainerProfileAttachment {
  return {
    articleSlugs: attachment?.articleSlugs ?? [],
    relatedLinks: attachment?.relatedLinks ?? [],
    galleryImages: attachment?.galleryImages ?? [],
    includeAutoArticles: attachment?.includeAutoArticles ?? true,
    includeAutoGallery: attachment?.includeAutoGallery ?? true,
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

function ArticlePicker({
  articleOptions,
  attachment,
}: {
  articleOptions: TrainerArticleOption[]
  attachment: TrainerProfileAttachment
}) {
  const [query, setQuery] = useState('')
  const selectedSlugs = useMemo(() => new Set(attachment.articleSlugs), [attachment.articleSlugs])
  const knownSlugs = useMemo(() => new Set(articleOptions.map((article) => article.slug)), [articleOptions])
  const missingSelectedSlugs = attachment.articleSlugs.filter((slug) => !knownSlugs.has(slug))
  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const selectedArticles = articleOptions.filter((article) => selectedSlugs.has(article.slug))
    const matchedArticles = normalized
      ? articleOptions.filter((article) =>
          `${article.title} ${article.slug} ${article.category}`.toLowerCase().includes(normalized),
        )
      : articleOptions
    const seen = new Set<string>()
    return [...selectedArticles, ...matchedArticles].filter((article) => {
      if (seen.has(article.slug)) return false
      seen.add(article.slug)
      return true
    })
  }, [articleOptions, query, selectedSlugs])

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <FileText className="h-4 w-4 text-[#1D4ED8]" />
            Related Posts & Articles
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">Choose posts, articles, or newsletters to show on this trainer profile.</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium">
          <input type="checkbox" name="include_auto_articles" defaultChecked={attachment.includeAutoArticles} />
          Include automatic matches
        </label>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search posts by title, category, or slug"
          className="rounded-lg bg-white pl-9"
        />
      </label>

      <div className="max-h-64 overflow-y-auto rounded-lg border bg-white p-3">
        {visibleArticles.length ? (
          <div className="space-y-2">
            {visibleArticles.map((article) => (
              <label key={article.slug} className="flex gap-3 rounded-lg p-2 text-sm hover:bg-[#EFF6FF]">
                <input
                  type="checkbox"
                  name="article_slugs"
                  value={article.slug}
                  defaultChecked={selectedSlugs.has(article.slug)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block font-medium text-[#0F172A]">{article.title}</span>
                  <span className="mt-0.5 block break-all text-xs text-muted-foreground">
                    {article.category} / {article.slug} {formatDate(article.created_at) ? `/ ${formatDate(article.created_at)}` : ''}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No matching posts found.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Extra Post or Article Slugs</Label>
        <Textarea
          name="extra_article_slugs"
          defaultValue={missingSelectedSlugs.join('\n')}
          className="rounded-lg bg-white"
          rows={2}
          placeholder="One extra /blog slug per line"
        />
      </div>
    </section>
  )
}

function RelatedLinksEditor({ attachment }: { attachment: TrainerProfileAttachment }) {
  const [rows, setRows] = useState(() =>
    attachment.relatedLinks.map((link, index) => ({
      key: `related-link-${index}-${link.href}`,
      label: link.label,
      href: link.href,
      description: link.description ?? '',
    })),
  )

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Link2 className="h-4 w-4 text-[#1D4ED8]" />
            Related Links
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">Add useful profile links, resources, videos, or external pages.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg bg-white"
          onClick={() => setRows((current) => [...current, { key: `new-link-${Date.now()}`, label: '', href: '', description: '' }])}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add link
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.key} className="grid gap-3 rounded-lg border bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label>Link Label</Label>
              <Input name="related_link_label" defaultValue={row.label} className="rounded-lg" placeholder="Workshop recap" />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input name="related_link_href" defaultValue={row.href} className="rounded-lg" placeholder="/blog/post-slug or https://..." />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="mt-7 rounded-lg"
              aria-label={`Remove related link ${index + 1}`}
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="space-y-2 md:col-span-3">
              <Label>Description</Label>
              <Input name="related_link_description" defaultValue={row.description} className="rounded-lg" placeholder="Optional short description" />
            </div>
          </div>
        ))}
        {!rows.length ? (
          <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
            No custom links. Use Add link to attach related resources or pages.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function GalleryEditor({ attachment }: { attachment: TrainerProfileAttachment }) {
  const [rows, setRows] = useState(() =>
    attachment.galleryImages.map((image, index) => ({
      key: `gallery-${index}-${image.src}`,
      src: image.src,
      alt: image.alt ?? '',
      caption: image.caption ?? '',
    })),
  )

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <ImagePlus className="h-4 w-4 text-[#1D4ED8]" />
            Photo Gallery
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">Add, remove, or reorder trainer-specific gallery photos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium">
            <input type="checkbox" name="include_auto_gallery" defaultChecked={attachment.includeAutoGallery} />
            Include event photos
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg bg-white"
            onClick={() => setRows((current) => [...current, { key: `new-${Date.now()}`, src: '', alt: '', caption: '' }])}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add photo
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.key} className="grid gap-3 rounded-lg border bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2 md:col-span-2">
              <Label>Image URL</Label>
              <Input name="gallery_src" defaultValue={row.src} className="rounded-lg" placeholder="/images/photos/example.jpg" />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="mt-7 rounded-lg"
              aria-label={`Remove gallery photo ${index + 1}`}
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input name="gallery_alt" defaultValue={row.alt} className="rounded-lg" placeholder="Trainer workshop photo" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Caption</Label>
              <Input name="gallery_caption" defaultValue={row.caption} className="rounded-lg" placeholder="Optional caption" />
            </div>
          </div>
        ))}
        {!rows.length ? (
          <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
            No custom gallery photos. Use Add photo to attach images for this trainer.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function TrainerFields({
  trainer,
  articleOptions,
  attachment,
}: {
  trainer?: Partial<Trainer>
  articleOptions: TrainerArticleOption[]
  attachment?: Partial<TrainerProfileAttachment>
}) {
  const normalizedAttachment = attachmentWithDefaults(attachment)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" defaultValue={trainer?.name ?? ''} required className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label>Profile Slug</Label>
          <Input name="slug" defaultValue={trainer?.slug ?? ''} placeholder="fatima-tuz-zahra" className="rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input name="title" defaultValue={trainer?.title ?? 'Jolly Phonics Certified Trainer'} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input name="sort_order" type="number" defaultValue={trainer?.sort_order ?? 0} className="rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea name="bio" defaultValue={trainer?.bio ?? ''} className="rounded-lg" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Profile Details</Label>
        <Textarea name="profile_details" defaultValue={trainer?.profile_details ?? ''} className="rounded-lg" rows={4} />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input name="image_url" defaultValue={trainer?.image_url ?? ''} className="rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Achievements</Label>
          <Textarea name="achievements" defaultValue={listToText(trainer?.achievements)} className="rounded-lg" rows={5} placeholder="One achievement per line" />
        </div>
        <div className="space-y-2">
          <Label>Credentials</Label>
          <Textarea name="credentials" defaultValue={listToText(trainer?.credentials)} className="rounded-lg" rows={5} placeholder="One credential per line" />
        </div>
        <div className="space-y-2">
          <Label>Specialties</Label>
          <Textarea name="specialties" defaultValue={listToText(trainer?.specialties)} className="rounded-lg" rows={5} placeholder="One specialty per line" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={trainer?.published ?? true} /> Published
      </label>
      <ArticlePicker articleOptions={articleOptions} attachment={normalizedAttachment} />
      <RelatedLinksEditor attachment={normalizedAttachment} />
      <GalleryEditor attachment={normalizedAttachment} />
    </>
  )
}

function TrainerCreateForm({ articleOptions }: { articleOptions: TrainerArticleOption[] }) {
  const [state, formAction, pending] = useActionState(createTrainerAction, initial)
  return (
    <form action={formAction} className="max-w-3xl space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Add Trainer</h2>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Trainer added.</p> : null}
      <TrainerFields articleOptions={articleOptions} />
      <Button type="submit" disabled={pending} className="rounded-lg bg-[#1D4ED8]">
        {pending ? 'Adding...' : 'Add Trainer'}
      </Button>
    </form>
  )
}

function TrainerEditForm({
  trainer,
  articleOptions,
  attachment,
}: {
  trainer: Trainer
  articleOptions: TrainerArticleOption[]
  attachment?: TrainerProfileAttachment
}) {
  const [state, formAction, pending] = useActionState(updateTrainerAction.bind(null, trainer.id), initial)

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{trainer.name}</h3>
          <p className="text-sm text-muted-foreground">/certified-trainers/{trainer.slug}</p>
        </div>
        <form action={deleteTrainerAction.bind(null, trainer.id)}>
          <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Trainer updated.</p> : null}
      <form action={formAction} className="space-y-4">
        <TrainerFields trainer={trainer} articleOptions={articleOptions} attachment={attachment} />
        <Button type="submit" disabled={pending} className="rounded-lg bg-[#1D4ED8]">
          {pending ? 'Saving...' : 'Save Trainer'}
        </Button>
      </form>
    </div>
  )
}

export function TrainersAdmin({
  trainers,
  articleOptions,
  profileAttachments,
}: {
  trainers: Trainer[]
  articleOptions: TrainerArticleOption[]
  profileAttachments: TrainerProfileAttachments
}) {
  return (
    <div className="space-y-8">
      <TrainerCreateForm articleOptions={articleOptions} />
      <div className="space-y-5">
        {trainers.map((trainer) => (
          <TrainerEditForm
            key={trainer.id}
            trainer={trainer}
            articleOptions={articleOptions}
            attachment={profileAttachments[trainerSlug(trainer)]}
          />
        ))}
      </div>
    </div>
  )
}
