'use client'

import { useActionState } from 'react'
import { createBlogPostAction, updateBlogPostAction } from '@/actions/admin/blog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { BLOG_CATEGORIES } from '@/lib/constants'
import type { BlogPost } from '@/types/database'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

export function BlogForm({ post }: { post?: BlogPost }) {
  const action = post ? updateBlogPostAction.bind(null, post.id) : createBlogPostAction
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-4 max-w-3xl">
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Saved!</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input name="title" defaultValue={post?.title} required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input name="slug" defaultValue={post?.slug} required className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Textarea name="excerpt" defaultValue={post?.excerpt ?? ''} className="rounded-xl" rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Content (HTML)</Label>
        <Textarea name="content" defaultValue={post?.content} required rows={12} className="rounded-xl font-mono text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category" defaultValue={post?.category} className="w-full rounded-xl border px-3 py-2">
            {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input name="tags" defaultValue={post?.tags?.join(', ')} className="rounded-xl" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Cover Image URL</Label>
          <Input name="cover_image" defaultValue={post?.cover_image ?? ''} className="rounded-xl" />
          <ImageUpload folder="phonics-club/blog" onUpload={(url) => {
            const input = document.querySelector<HTMLInputElement>('input[name="cover_image"]')
            if (input) input.value = url
          }} />
        </div>
        <div className="space-y-2">
          <Label>SEO Title</Label>
          <Input name="seo_title" defaultValue={post?.seo_title ?? ''} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>SEO Description</Label>
          <Input name="seo_description" defaultValue={post?.seo_description ?? ''} className="rounded-xl" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} /> Published
      </label>
      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
        {pending ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
      </Button>
    </form>
  )
}
