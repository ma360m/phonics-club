'use client'

import { useActionState, useState } from 'react'
import { createCourseAction, updateCourseAction } from '@/actions/admin/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CourseMediaUpload } from './course-media-upload'
import { CurriculumBuilder } from './curriculum-builder'
import { COURSE_CATEGORIES } from '@/lib/constants'
import type { Course, CurriculumModule } from '@/types/database'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all-levels']

function metaString(course: Course | undefined, key: string): string {
  const value = course?.metadata?.[key]
  return typeof value === 'string' ? value : ''
}

function metaLines(course: Course | undefined, key: string): string {
  const value = course?.metadata?.[key]
  return Array.isArray(value) ? value.join('\n') : ''
}

function metaNumber(course: Course | undefined, key: string): string {
  const value = course?.metadata?.[key]
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? String(number) : ''
}

function metaBoolean(course: Course | undefined, key: string): boolean {
  return course?.metadata?.[key] === true
}

function datetimeValue(value?: string | null): string {
  return value ? value.slice(0, 16) : ''
}

export function CourseForm({ course }: { course?: Course }) {
  const action = course ? updateCourseAction.bind(null, course.id) : createCourseAction
  const [state, formAction, pending] = useActionState(action, initial)
  const [curriculum, setCurriculum] = useState<CurriculumModule[]>(course?.curriculum ?? [])

  return (
    <form action={formAction} className="max-w-5xl space-y-6">
      <input type="hidden" name="existing_metadata" value={JSON.stringify(course?.metadata ?? {})} />
      {state.error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully!</p>}

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
        <Label>Subtitle</Label>
        <Input name="subtitle" defaultValue={course?.subtitle ?? ''} className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Short Description (excerpt)</Label>
        <Input name="excerpt" defaultValue={course?.excerpt ?? ''} className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Full Description</Label>
        <Textarea name="description" defaultValue={course?.description ?? ''} className="rounded-xl" rows={4} />
      </div>

      <div className="space-y-2">
        <Label>Rich LMS Description</Label>
        <Textarea name="rich_description" defaultValue={course?.rich_description ?? ''} className="rounded-xl" rows={5} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price</Label>
          <Input name="price" type="number" step="1" defaultValue={course?.price ?? 0} className="rounded-xl" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="is_free" defaultChecked={course ? course.is_free ?? Number(course.price ?? 0) <= 0 : false} />
            Set this course as free
          </label>
        </div>
        <div className="space-y-2">
          <Label>Discounted Price</Label>
          <Input name="discounted_price" type="number" step="1" defaultValue={course?.discounted_price ?? ''} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input name="currency" defaultValue={course?.currency ?? 'PKR'} className="rounded-xl" />
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
          <Label>Language</Label>
          <Input name="language" defaultValue={course?.language ?? 'English'} className="rounded-xl" />
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
        <div className="space-y-2">
          <Label>Instructor Image URL</Label>
          <Input name="instructor_image_url" defaultValue={course?.instructor_image_url ?? course?.instructor_avatar ?? ''} className="rounded-xl" />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Instructor Help Option</h2>
            <p className="mt-1 text-sm text-slate-500">
              Show an extra public course tab for guided instructor support and a separate total price.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <input type="checkbox" name="instructor_help_enabled" defaultChecked={metaBoolean(course, 'instructorHelpEnabled')} />
            Enable
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tab Label</Label>
            <Input name="instructor_help_label" defaultValue={metaString(course, 'instructorHelpLabel') || 'Instructor Help'} className="rounded-xl bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Total Price With Instructor Help</Label>
            <Input name="instructor_help_price" type="number" step="1" defaultValue={metaNumber(course, 'instructorHelpPrice')} placeholder="5000" className="rounded-xl bg-white" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              name="instructor_help_description"
              defaultValue={metaString(course, 'instructorHelpDescription')}
              rows={3}
              className="rounded-xl bg-white"
              placeholder="Rs 5,000 is the total course price with instructor help included."
            />
          </div>
          <div className="space-y-2">
            <Label>What Instructor Help Includes</Label>
            <Textarea
              name="instructor_help_includes"
              defaultValue={metaLines(course, 'instructorHelpIncludes')}
              rows={4}
              className="rounded-xl bg-white"
              placeholder="Course access plus instructor support&#10;Parent guidance and progress check-ins"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Instructor Link</Label>
            <Input
              name="instructor_help_contact_href"
              defaultValue={metaString(course, 'instructorHelpContactHref')}
              className="rounded-xl bg-white"
              placeholder="https://wa.me/923008079480"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
        <h2 className="mb-4 text-lg font-semibold">Course Media</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <CourseMediaUpload
            name="image_url"
            label="Course Thumbnail"
            defaultValue={course?.image_url ?? ''}
            folder="courses/thumbnails"
            kind="image"
          />
          <CourseMediaUpload
            name="thumbnail_url"
            label="Library Thumbnail"
            defaultValue={course?.thumbnail_url ?? course?.image_url ?? ''}
            folder="courses/thumbnails"
            kind="image"
          />
          <CourseMediaUpload
            name="banner_url"
            label="Course Banner"
            defaultValue={course?.banner_url ?? ''}
            folder="courses/banners"
            kind="image"
          />
          <CourseMediaUpload
            name="certificate_background_url"
            label="Certificate Background"
            defaultValue={course?.certificate_background_url ?? ''}
            folder="courses/certificates"
            kind="image"
          />
          <CourseMediaUpload
            name="hero_video_url"
            label="Hero Video"
            defaultValue={course?.hero_video_url ?? ''}
            folder="courses/videos"
            kind="video"
          />
          <CourseMediaUpload
            name="preview_video_url"
            label="Preview Video"
            defaultValue={metaString(course, 'previewVideoUrl')}
            folder="courses/videos"
            kind="video"
            placeholder="Upload or paste YouTube/video URL"
          />
        </div>
      </section>

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
        <Label>Course Highlights (one per line)</Label>
        <Textarea
          name="highlights"
          defaultValue={metaLines(course, 'highlights')}
          rows={4}
          className="rounded-xl"
          placeholder="Learning 42 letter sounds through actions"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Core Materials (one per line)</Label>
          <Textarea
            name="core_materials"
            defaultValue={metaLines(course, 'coreMaterials')}
            rows={4}
            className="rounded-xl"
            placeholder="Jolly Phonics Pupil Books 1 and 2"
          />
        </div>
        <div className="space-y-2">
          <Label>Intended Audience (one per line)</Label>
          <Textarea
            name="intended_audience"
            defaultValue={metaLines(course, 'intendedAudience')}
            rows={4}
            className="rounded-xl"
            placeholder="English teachers"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Audience (one per line)</Label>
        <Textarea
          name="target_audience"
          defaultValue={(course?.target_audience ?? []).join('\n')}
          rows={3}
          className="rounded-xl"
          placeholder="Early years teachers&#10;School literacy coordinators"
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

      <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
        <h2 className="mb-4 text-lg font-semibold">Access, Time and Completion Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Enrolment Opens</Label>
            <Input name="enrolment_opens_at" type="datetime-local" defaultValue={datetimeValue(course?.enrolment_opens_at)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Enrolment Closes</Label>
            <Input name="enrolment_closes_at" type="datetime-local" defaultValue={datetimeValue(course?.enrolment_closes_at)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Max Students</Label>
            <Input name="max_students" type="number" min="1" defaultValue={course?.max_students ?? ''} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Access Duration (days)</Label>
            <Input name="access_duration_days" type="number" min="1" defaultValue={course?.access_duration_days ?? 90} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Required Online Minutes</Label>
            <Input name="required_online_minutes" type="number" min="0" defaultValue={course?.required_online_minutes ?? 0} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Required Offline Minutes</Label>
            <Input name="required_offline_minutes" type="number" min="0" defaultValue={course?.required_offline_minutes ?? 0} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Passing Quiz %</Label>
            <Input name="passing_quiz_percentage" type="number" min="0" max="100" defaultValue={course?.passing_quiz_percentage ?? 70} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Required Assignment Passes</Label>
            <Input name="required_assignment_passes" type="number" min="0" defaultValue={course?.required_assignment_passes ?? 0} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Daily Online Cap</Label>
            <Input name="daily_online_minutes_cap" type="number" min="1" defaultValue={course?.daily_online_minutes_cap ?? 480} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Inactivity Timeout (sec)</Label>
            <Input name="inactivity_timeout_seconds" type="number" min="180" max="300" defaultValue={course?.inactivity_timeout_seconds ?? 240} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Max Offline Entry Minutes</Label>
            <Input name="max_offline_entry_minutes" type="number" min="1" defaultValue={course?.max_offline_entry_minutes ?? 360} className="rounded-xl" />
          </div>
        </div>
      </div>

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
          <input type="checkbox" name="published" defaultChecked={course?.published ?? true} /> Show on public Courses page
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="certificate_enabled"
            defaultChecked={course?.certificate_enabled ?? course?.metadata?.certificateEnabled !== false}
          /> Certificate
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        {[
          ['completion_requires_lessons', 'Require compulsory lessons', course?.completion_requires_lessons ?? true],
          ['completion_requires_online_minutes', 'Require online minutes', course?.completion_requires_online_minutes ?? false],
          ['completion_requires_offline_minutes', 'Require offline minutes', course?.completion_requires_offline_minutes ?? false],
          ['completion_requires_quiz', 'Require final quiz', course?.completion_requires_quiz ?? false],
          ['completion_requires_assignments', 'Require assignments', course?.completion_requires_assignments ?? false],
          ['completion_requires_active_enrollment', 'Require active access', course?.completion_requires_active_enrollment ?? true],
          ['completion_requires_instructor_approval', 'Require instructor approval', course?.completion_requires_instructor_approval ?? false],
          ['offline_evidence_required', 'Require offline evidence', course?.offline_evidence_required ?? false],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} />
            {String(label)}
          </label>
        ))}
      </div>

      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
        {pending ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
      </Button>
    </form>
  )
}
