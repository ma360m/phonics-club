import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  createCourseLessonFormAction,
  createCourseModuleFormAction,
  deleteCourseLessonAction,
  deleteCourseModuleAction,
  deleteCourseResourceAction,
  getAdminCourseLms,
  updateCourseLessonFormAction,
  updateCourseModuleFormAction,
  uploadCourseResourceFormAction,
} from '@/actions/admin/lms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CourseMediaUpload } from '@/components/admin/course-media-upload'
import {
  ArrowLeft,
  BookOpen,
  FileUp,
  Layers3,
  Link2,
  Plus,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react'

const LESSON_TYPES = [
  ['video', 'Video'],
  ['reading', 'Reading'],
  ['flipbook', 'Flipbook'],
  ['pdf', 'PDF'],
  ['presentation', 'Presentation'],
  ['interactive', 'Interactive'],
  ['quiz', 'Quiz'],
  ['assignment', 'Assignment'],
  ['download', 'Download'],
  ['live_class', 'Live Class'],
  ['external_link', 'External Link'],
]

const READING_TYPES = [
  ['', 'No reading mode'],
  ['rich_article', 'Rich Article'],
  ['pdf_viewer', 'PDF Viewer'],
  ['flipbook', 'Flipbook'],
  ['powerpoint_slides', 'PowerPoint Slides'],
  ['interactive_presentation', 'Interactive Presentation'],
]

const MODULE_TRANSITIONS = [
  ['fade', 'Fade'],
  ['slide', 'Slide'],
  ['unlock', 'Unlock'],
  ['progress', 'Progress'],
]

const UNLOCK_ANIMATIONS = [
  ['none', 'None'],
  ['progress-ring', 'Progress ring'],
  ['confetti', 'Confetti'],
  ['slide-unlock', 'Slide unlock'],
]

const LESSON_TOGGLES = [
  ['is_preview', 'Preview'],
  ['is_compulsory', 'Compulsory'],
  ['sequentially_locked', 'Sequential lock'],
  ['manual_completion_allowed', 'Manual completion'],
  ['bookmark_enabled', 'Bookmarks'],
  ['highlight_enabled', 'Highlights'],
  ['search_enabled', 'Search'],
  ['zoom_enabled', 'Zoom'],
  ['fullscreen_enabled', 'Fullscreen'],
  ['dark_mode_enabled', 'Dark mode'],
  ['download_enabled', 'Download'],
  ['print_enabled', 'Print'],
  ['confetti_enabled', 'Confetti'],
  ['published', 'Published'],
]

const LESSON_TOGGLE_DEFAULTS: Record<string, boolean> = {
  is_preview: false,
  is_compulsory: true,
  sequentially_locked: true,
  manual_completion_allowed: true,
  bookmark_enabled: true,
  highlight_enabled: true,
  search_enabled: true,
  zoom_enabled: true,
  fullscreen_enabled: true,
  dark_mode_enabled: true,
  download_enabled: true,
  print_enabled: false,
  confetti_enabled: true,
  published: true,
}

function field(label: string, child: ReactNode) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {child}
    </div>
  )
}

function selectedLessonValue(lesson: Record<string, unknown>, name: string) {
  return lesson[name] === undefined || lesson[name] === null ? LESSON_TOGGLE_DEFAULTS[name] ?? false : Boolean(lesson[name])
}

export default async function AdminCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminCourseLms(id)
  if (!data.course) notFound()

  const modules = [...data.modules].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const lessonCount = modules.reduce((total: number, module: any) => total + (module.course_lessons?.length ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 rounded-xl">
            <Link href={`/admin/courses/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Course settings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-sm text-muted-foreground">{data.course.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/courses/${data.course.slug}`}>View public page</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modules</p>
          <p className="mt-1 text-2xl font-bold">{modules.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lessons</p>
          <p className="mt-1 text-2xl font-bold">{lessonCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
          <p className="mt-1 text-2xl font-bold">{data.resources.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-[#1D4ED8]" />
          <h2 className="text-xl font-bold">Add Module</h2>
        </div>
        <form action={createCourseModuleFormAction.bind(null, id)} className="grid gap-4 lg:grid-cols-2">
          {field('Module Title', <Input name="title" placeholder="Introduction to Jolly Phonics" required className="rounded-xl" />)}
          {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
          <div className="lg:col-span-2">
            {field('Description', <Textarea name="description" placeholder="What this module covers" className="rounded-xl" rows={2} />)}
          </div>
          <div className="lg:col-span-2">
            <CourseMediaUpload
              name="thumbnail_url"
              label="Module Thumbnail"
              folder={`courses/${id}/modules`}
              kind="image"
            />
          </div>
          <input type="hidden" name="transition_style" value="fade" />
          <input type="hidden" name="unlock_animation" value="progress-ring" />
          <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:w-fit">
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
            <h2 className="text-xl font-bold">No modules yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add the first module above, then add lessons inside it.</p>
          </div>
        ) : null}

        {modules.map((module: any) => {
          const lessons = [...(module.course_lessons ?? [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

          return (
            <article key={module.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="outline" className="mb-2 rounded-full">Module {module.sort_order || 1}</Badge>
                  <h2 className="text-xl font-bold">{module.title}</h2>
                  <p className="text-sm text-muted-foreground">{lessons.length} lessons</p>
                </div>
              </div>

              <form action={updateCourseModuleFormAction.bind(null, module.id, id)} className="rounded-xl border bg-muted/20 p-4">
                <div className="grid gap-4 lg:grid-cols-[100px_1fr]">
                  {field('Order', <Input name="sort_order" type="number" defaultValue={module.sort_order} className="rounded-xl" />)}
                  {field('Module Title', <Input name="title" defaultValue={module.title} className="rounded-xl font-semibold" />)}
                </div>
                <div className="mt-4">
                  {field('Description', <Textarea name="description" defaultValue={module.description ?? ''} className="rounded-xl" rows={2} />)}
                </div>
                <div className="mt-4">
                  <CourseMediaUpload
                    name="thumbnail_url"
                    label="Module Thumbnail"
                    defaultValue={module.thumbnail_url ?? ''}
                    folder={`courses/${id}/modules`}
                    kind="image"
                  />
                </div>

                <details className="mt-4 rounded-xl border bg-background p-3">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <Settings2 className="h-4 w-4 text-[#1D4ED8]" />
                    Module settings
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {field(
                      'Transition',
                      <select name="transition_style" defaultValue={module.transition_style ?? 'fade'} className="w-full rounded-xl border px-3 py-2 text-sm">
                        {MODULE_TRANSITIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    )}
                    {field(
                      'Unlock Animation',
                      <select name="unlock_animation" defaultValue={module.unlock_animation ?? 'progress-ring'} className="w-full rounded-xl border px-3 py-2 text-sm">
                        {UNLOCK_ANIMATIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="submit" variant="outline" className="rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    Save Module
                  </Button>
                  <Button formAction={deleteCourseModuleAction.bind(null, module.id, id)} variant="destructive" className="rounded-xl">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Module
                  </Button>
                </div>
              </form>

              <div className="mt-5 space-y-4">
                {lessons.map((lesson: any) => (
                  <form key={lesson.id} action={updateCourseLessonFormAction.bind(null, lesson.id, id)} className="rounded-xl border bg-background p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Badge className="mb-2 rounded-full bg-[#1D4ED8] text-white">Lesson {lesson.sort_order || 1}</Badge>
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm" variant="outline" className="rounded-xl">
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button formAction={deleteCourseLessonAction.bind(null, lesson.id, id)} size="sm" variant="destructive" className="rounded-xl">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[80px_1fr_160px_120px_180px]">
                      {field('Order', <Input name="sort_order" type="number" defaultValue={lesson.sort_order} className="rounded-xl" />)}
                      {field('Title', <Input name="title" defaultValue={lesson.title} className="rounded-xl" />)}
                      {field(
                        'Type',
                        <select name="lesson_type" defaultValue={lesson.lesson_type ?? 'video'} className="w-full rounded-xl border px-3 py-2 text-sm">
                          {LESSON_TYPES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                      {field('Minutes', <Input name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? 0} className="rounded-xl" />)}
                      {field(
                        'Completion',
                        <select name="completion_mode" defaultValue={lesson.completion_mode ?? 'manual'} className="w-full rounded-xl border px-3 py-2 text-sm">
                          <option value="manual">Manual</option>
                          <option value="content_threshold">Content threshold</option>
                          <option value="video_threshold">Video threshold</option>
                        </select>
                      )}
                    </div>

                    <div className="mt-3">
                      {field('Lesson Description', <Textarea name="description" defaultValue={lesson.description ?? ''} className="rounded-xl" rows={2} />)}
                    </div>

                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <CourseMediaUpload
                        name="thumbnail_url"
                        label="Lesson Thumbnail"
                        defaultValue={lesson.thumbnail_url ?? ''}
                        folder={`courses/${id}/lessons`}
                        kind="image"
                      />
                      <CourseMediaUpload
                        name="video_url"
                        label="Lesson Video"
                        defaultValue={lesson.video_url ?? ''}
                        folder={`courses/${id}/videos`}
                        kind="video"
                      />
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-3">
                      {field(
                        'Reading Mode',
                        <select name="reading_type" defaultValue={lesson.reading_type ?? ''} className="w-full rounded-xl border px-3 py-2 text-sm">
                          {READING_TYPES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                      {field('Material URL', <Input name="material_url" defaultValue={lesson.material_url ?? ''} placeholder="PDF, worksheet or download URL" className="rounded-xl" />)}
                      {field('Reading/PDF URL', <Input name="reading_external_url" defaultValue={lesson.reading_external_url ?? ''} className="rounded-xl" />)}
                      {field('Live Session URL', <Input name="live_session_url" defaultValue={lesson.live_session_url ?? ''} className="rounded-xl" />)}
                      {field('External Lesson Link', <Input name="external_link_url" defaultValue={lesson.external_link_url ?? ''} className="rounded-xl" />)}
                    </div>

                    <details className="mt-4 rounded-xl border bg-muted/20 p-3">
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                        <Settings2 className="h-4 w-4 text-[#1D4ED8]" />
                        Content and settings
                      </summary>
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {field('Rich Content', <Textarea name="rich_content" defaultValue={lesson.rich_content ?? lesson.content ?? ''} className="rounded-xl" rows={4} />)}
                        {field('Article Content', <Textarea name="article_content" defaultValue={lesson.article_content ?? ''} className="rounded-xl" rows={4} />)}
                        {field('Practice Prompt', <Textarea name="practice_prompt" defaultValue={lesson.practice_prompt ?? ''} className="rounded-xl" rows={2} />)}
                        {field('Discussion Prompt', <Textarea name="discussion_prompt" defaultValue={lesson.discussion_prompt ?? ''} className="rounded-xl" rows={2} />)}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {LESSON_TOGGLES.map(([name, label]) => (
                          <label key={name} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                            <input type="checkbox" name={name} defaultChecked={selectedLessonValue(lesson, name)} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {field(
                          'Completion Animation',
                          <select name="completion_animation" defaultValue={lesson.completion_animation ?? 'progress-ring'} className="w-full rounded-xl border px-3 py-2 text-sm">
                            <option value="none">None</option>
                            <option value="progress-ring">Progress ring</option>
                            <option value="confetti">Confetti</option>
                            <option value="unlock">Unlock</option>
                          </select>
                        )}
                        {field('Threshold %', <Input name="required_completion_percentage" type="number" min="0" max="100" defaultValue={lesson.required_completion_percentage ?? 80} className="rounded-xl" />)}
                      </div>
                    </details>
                  </form>
                ))}

                <form action={createCourseLessonFormAction.bind(null, id, module.id)} className="rounded-xl border border-dashed bg-muted/10 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#1D4ED8]" />
                    <h3 className="text-lg font-semibold">Add Lesson</h3>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[80px_1fr_160px_120px]">
                    {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
                    {field('Title', <Input name="title" placeholder="Welcome" required className="rounded-xl" />)}
                    {field(
                      'Type',
                      <select name="lesson_type" defaultValue="video" className="w-full rounded-xl border px-3 py-2 text-sm">
                        {LESSON_TYPES.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    )}
                    {field('Minutes', <Input name="duration_minutes" type="number" placeholder="10" className="rounded-xl" />)}
                  </div>
                  <div className="mt-3">
                    {field('Lesson Description', <Textarea name="description" className="rounded-xl" rows={2} />)}
                  </div>
                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    <CourseMediaUpload
                      name="thumbnail_url"
                      label="Lesson Thumbnail"
                      folder={`courses/${id}/lessons`}
                      kind="image"
                    />
                    <CourseMediaUpload
                      name="video_url"
                      label="Lesson Video"
                      folder={`courses/${id}/videos`}
                      kind="video"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {field(
                      'Reading Mode',
                      <select name="reading_type" defaultValue="" className="w-full rounded-xl border px-3 py-2 text-sm">
                        {READING_TYPES.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    )}
                    {field('Material URL', <Input name="material_url" placeholder="PDF, worksheet or download URL" className="rounded-xl" />)}
                    {field('Reading/PDF URL', <Input name="reading_external_url" className="rounded-xl" />)}
                    {field('Practice Prompt', <Input name="practice_prompt" className="rounded-xl" />)}
                    {field('Discussion Prompt', <Input name="discussion_prompt" className="rounded-xl" />)}
                  </div>
                  <input type="hidden" name="is_compulsory" value="on" />
                  <input type="hidden" name="sequentially_locked" value="on" />
                  <input type="hidden" name="manual_completion_allowed" value="on" />
                  <input type="hidden" name="bookmark_enabled" value="on" />
                  <input type="hidden" name="highlight_enabled" value="on" />
                  <input type="hidden" name="download_enabled" value="on" />
                  <input type="hidden" name="dark_mode_enabled" value="on" />
                  <input type="hidden" name="fullscreen_enabled" value="on" />
                  <input type="hidden" name="search_enabled" value="on" />
                  <input type="hidden" name="zoom_enabled" value="on" />
                  <input type="hidden" name="completion_animation" value="progress-ring" />
                  <input type="hidden" name="completion_mode" value="manual" />
                  <input type="hidden" name="required_completion_percentage" value="80" />
                  <input type="hidden" name="confetti_enabled" value="on" />
                  <input type="hidden" name="published" value="on" />
                  <Button type="submit" className="mt-4 rounded-xl bg-[#1D4ED8]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lesson
                  </Button>
                </form>
              </div>
            </article>
          )
        })}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileUp className="h-5 w-5 text-[#1D4ED8]" />
          <h2 className="text-xl font-bold">Course Resources</h2>
        </div>
        <form action={uploadCourseResourceFormAction.bind(null, id)} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-3">
          {field('Title', <Input name="title" required className="rounded-xl" />)}
          {field(
            'File',
            <Input
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*,audio/*,video/mp4,video/webm"
              className="rounded-xl"
            />
          )}
          {field('External URL', <Input name="external_url" placeholder="https://..." className="rounded-xl" />)}
          <div className="lg:col-span-3">
            {field('Description', <Textarea name="description" className="rounded-xl" rows={2} />)}
          </div>
          {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
          {field(
            'Visibility',
            <select name="visibility" defaultValue="enrolled" className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="enrolled">Enrolled</option>
              <option value="paid">Paid</option>
              <option value="admin">Admin</option>
            </select>
          )}
          {field(
            'Scope',
            <select name="scope" defaultValue="course" className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="course">Course</option>
              <option value="module">Module</option>
              <option value="lesson">Lesson</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </select>
          )}
          {field(
            'Attach to Module',
            <select name="module_id" defaultValue="" className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="">Whole course</option>
              {modules.map((module: any) => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
          )}
          {field(
            'Attach to Lesson',
            <select name="lesson_id" defaultValue="" className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="">No lesson</option>
              {modules.flatMap((module: any) => (module.course_lessons ?? []).map((lesson: any) => (
                <option key={lesson.id} value={lesson.id}>{module.title} - {lesson.title}</option>
              )))}
            </select>
          )}
          <div className="flex flex-wrap gap-4 text-sm lg:col-span-3">
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <input type="checkbox" name="is_downloadable" defaultChecked />
              Downloadable
            </label>
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <input type="checkbox" name="is_view_only" />
              View only
            </label>
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <input type="checkbox" name="is_compulsory" />
              Compulsory
            </label>
          </div>
          <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:w-fit">
            <FileUp className="mr-2 h-4 w-4" />
            Save Resource
          </Button>
        </form>

        <div className="mt-5 space-y-2">
          {data.resources.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No resources uploaded yet.</p>
          ) : null}
          {data.resources.map((resource: any) => (
            <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
              <div>
                <p className="font-medium">{resource.title}</p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{resource.visibility}</span>
                  <span>-</span>
                  <span>{resource.original_filename ?? resource.external_url ?? 'metadata only'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {resource.external_url ? <Link2 className="h-4 w-4 text-[#1D4ED8]" /> : null}
                {resource.is_compulsory && <Badge>Compulsory</Badge>}
                <form action={deleteCourseResourceAction.bind(null, resource.id, id)}>
                  <Button type="submit" size="sm" variant="destructive" className="rounded-xl">Delete</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
