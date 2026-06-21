'use client'

import { useActionState, useState } from 'react'
import { createCourseAction, updateCourseAction } from '@/actions/admin/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { CurriculumBuilder } from './curriculum-builder'
import { COURSE_CATEGORIES } from '@/lib/constants'
import type { Course, CurriculumModule } from '@/types/database'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all-levels']

function linesToArray(text: string) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

export function CourseForm({ course }: { course?: Course }) {
  const action = course ? updateCourseAction.bind(null, course.id) : createCourseAction
  const [state, formAction, pending] = useActionState(action, initial)
  const [curriculum, setCurriculum] = useState<CurriculumModule[]>(course?.curriculum ?? [])
  const [imageUrl, setImageUrl] = useState(course?.image_url ?? '')

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Saved successfully!</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input name="title" defaultValue={course?.title} required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Slug *</Label>
          <Input name="slug" defaultValue={course?.slug} required className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Short Description (excerpt)</Label>
        <Input name="excerpt" defaultValue={course?.excerpt ?? ''} className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Full Description</Label>
        <Textarea name="description" defaultValue={course?.description ?? ''} className="rounded-xl" rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price (PKR, 0 = free)</Label>
          <Input name="price" type="number" step="1" defaultValue={course?.price ?? 0} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category" defaultValue={course?.category ?? 'teacher-courses'} className="w-full rounded-xl border px-3 py-2">
            {COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <select name="level" defaultValue={course?.level ?? 'beginner'} className="w-full rounded-xl border px-3 py-2">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input name="duration" defaultValue={course?.duration ?? ''} placeholder="8 Weeks" className="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Instructor Name</Label>
          <Input name="instructor" defaultValue={course?.instructor ?? ''} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Instructor Bio</Label>
          <Input name="instructor_bio" defaultValue={course?.instructor_bio ?? ''} className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Course Thumbnail</Label>
        <Input name="image_url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-xl" />
        <ImageUpload folder="phonics-club/courses" onUpload={setImageUrl} />
      </div>

      <div className="space-y-2">
        <Label>Learning Objectives (one per line)</Label>
        <Textarea
          name="objectives"
          defaultValue={(course?.objectives ?? []).join('\n')}
          rows={4}
          className="rounded-xl"
          placeholder="Master synthetic phonics&#10;Plan effective lessons"
        />
      </div>

      <div className="space-y-2">
        <Label>Requirements (one per line)</Label>
        <Textarea
          name="requirements"
          defaultValue={(course?.requirements ?? []).join('\n')}
          rows={3}
          className="rounded-xl"
          placeholder="Teaching experience recommended&#10;Internet access"
        />
      </div>

      <input type="hidden" name="curriculum" value={JSON.stringify(curriculum)} />
      <CurriculumBuilder value={curriculum} onChange={setCurriculum} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SEO Title</Label>
          <Input name="seo_title" defaultValue={course?.seo_title ?? ''} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>SEO Description</Label>
          <Input name="seo_description" defaultValue={course?.seo_description ?? ''} className="rounded-xl" />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={course?.featured} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={course?.published ?? true} /> Published
        </label>
      </div>

      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
        {pending ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
      </Button>
    </form>
  )
}
