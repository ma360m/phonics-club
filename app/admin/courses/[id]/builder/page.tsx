import Link from 'next/link'
import { notFound } from 'next/navigation'
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
import { ArrowLeft, FileUp, Plus, Trash2 } from 'lucide-react'

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

export default async function AdminCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminCourseLms(id)
  if (!data.course) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 rounded-xl">
            <Link href={`/admin/courses/${id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Course settings</Link>
          </Button>
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-sm text-muted-foreground">{data.course.title}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/courses/${data.course.slug}`}>View public page</Link>
        </Button>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Add Module</h2>
        <form action={createCourseModuleFormAction.bind(null, id)} className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_120px_auto]">
          <Input name="title" placeholder="Module title" required className="rounded-xl" />
          <Input name="description" placeholder="Description" className="rounded-xl" />
          <Input name="thumbnail_url" placeholder="Module thumbnail URL" className="rounded-xl" />
          <Input name="sort_order" type="number" placeholder="Order" className="rounded-xl" />
          <input type="hidden" name="transition_style" value="fade" />
          <input type="hidden" name="unlock_animation" value="progress-ring" />
          <Button type="submit" className="rounded-xl bg-[#1D4ED8]"><Plus className="mr-2 h-4 w-4" /> Add</Button>
        </form>
      </section>

      <section className="space-y-4">
        {data.modules.map((module: any) => (
          <article key={module.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <form action={updateCourseModuleFormAction.bind(null, module.id, id)} className="grid gap-3 xl:grid-cols-[80px_1fr_1fr_1fr_150px_170px_auto_auto]">
              <Input name="sort_order" type="number" defaultValue={module.sort_order} className="rounded-xl" />
              <Input name="title" defaultValue={module.title} className="rounded-xl font-semibold" />
              <Input name="description" defaultValue={module.description ?? ''} className="rounded-xl" />
              <Input name="thumbnail_url" defaultValue={module.thumbnail_url ?? ''} placeholder="Thumbnail URL" className="rounded-xl" />
              <select name="transition_style" defaultValue={module.transition_style ?? 'fade'} className="rounded-xl border px-3 py-2 text-sm">
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="unlock">Unlock</option>
                <option value="progress">Progress</option>
              </select>
              <select name="unlock_animation" defaultValue={module.unlock_animation ?? 'progress-ring'} className="rounded-xl border px-3 py-2 text-sm">
                <option value="none">None</option>
                <option value="progress-ring">Progress ring</option>
                <option value="confetti">Confetti</option>
                <option value="slide-unlock">Slide unlock</option>
              </select>
              <Button type="submit" variant="outline" className="rounded-xl">Save</Button>
              <Button formAction={deleteCourseModuleAction.bind(null, module.id, id)} variant="destructive" className="rounded-xl">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 space-y-3">
              {(module.course_lessons ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                <form key={lesson.id} action={updateCourseLessonFormAction.bind(null, lesson.id, id)} className="rounded-xl border bg-muted/30 p-3">
                  <div className="grid gap-3 xl:grid-cols-[70px_1fr_130px_170px_110px_150px_auto]">
                    <Input name="sort_order" type="number" defaultValue={lesson.sort_order} className="rounded-xl" />
                    <Input name="title" defaultValue={lesson.title} className="rounded-xl" />
                    <select name="lesson_type" defaultValue={lesson.lesson_type ?? 'video'} className="rounded-xl border px-3 py-2 text-sm">
                      {LESSON_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <select name="reading_type" defaultValue={lesson.reading_type ?? ''} className="rounded-xl border px-3 py-2 text-sm">
                      {READING_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <Input name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? 0} className="rounded-xl" />
                    <select name="completion_mode" defaultValue={lesson.completion_mode ?? 'manual'} className="rounded-xl border px-3 py-2 text-sm">
                      <option value="manual">Manual</option>
                      <option value="content_threshold">Content threshold</option>
                      <option value="video_threshold">Video threshold</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline" className="rounded-xl">Save Lesson</Button>
                  </div>
                  <Textarea name="description" defaultValue={lesson.description ?? ''} placeholder="Lesson description" className="mt-3 rounded-xl" rows={2} />
                  <Textarea name="rich_content" defaultValue={lesson.rich_content ?? lesson.content ?? ''} placeholder="Rich lesson content" className="mt-3 rounded-xl" rows={3} />
                  <Textarea
                    name="article_content"
                    defaultValue={lesson.article_content ?? ''}
                    placeholder="Official licensed reading content. This is rendered directly, not summarized."
                    className="mt-3 rounded-xl"
                    rows={4}
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input name="thumbnail_url" defaultValue={lesson.thumbnail_url ?? ''} placeholder="Lesson thumbnail URL" className="rounded-xl" />
                    <Input name="video_url" defaultValue={lesson.video_url ?? ''} placeholder="External video URL" className="rounded-xl" />
                    <Input name="material_url" defaultValue={lesson.material_url ?? ''} placeholder="Material URL" className="rounded-xl" />
                    <Input name="reading_external_url" defaultValue={lesson.reading_external_url ?? ''} placeholder="Reading/PDF/slide URL" className="rounded-xl" />
                    <Input name="live_session_url" defaultValue={lesson.live_session_url ?? ''} placeholder="Live session URL" className="rounded-xl" />
                    <Input name="external_link_url" defaultValue={lesson.external_link_url ?? ''} placeholder="External lesson link" className="rounded-xl" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Textarea name="practice_prompt" defaultValue={lesson.practice_prompt ?? ''} placeholder="Practice activity prompt" className="rounded-xl" rows={2} />
                    <Textarea name="discussion_prompt" defaultValue={lesson.discussion_prompt ?? ''} placeholder="Discussion prompt" className="rounded-xl" rows={2} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {[
                      ['is_preview', 'Preview', lesson.is_preview],
                      ['is_compulsory', 'Compulsory', lesson.is_compulsory ?? true],
                      ['sequentially_locked', 'Sequential lock', lesson.sequentially_locked ?? true],
                      ['manual_completion_allowed', 'Manual completion', lesson.manual_completion_allowed ?? true],
                      ['bookmark_enabled', 'Bookmarks', lesson.bookmark_enabled ?? true],
                      ['highlight_enabled', 'Highlights', lesson.highlight_enabled ?? true],
                      ['search_enabled', 'Search', lesson.search_enabled ?? true],
                      ['zoom_enabled', 'Zoom', lesson.zoom_enabled ?? true],
                      ['fullscreen_enabled', 'Fullscreen', lesson.fullscreen_enabled ?? true],
                      ['dark_mode_enabled', 'Dark mode', lesson.dark_mode_enabled ?? true],
                      ['download_enabled', 'Download', lesson.download_enabled ?? true],
                      ['print_enabled', 'Print', lesson.print_enabled ?? false],
                      ['confetti_enabled', 'Confetti', lesson.confetti_enabled ?? true],
                      ['published', 'Published', lesson.published ?? true],
                    ].map(([name, label, checked]) => (
                      <label key={String(name)} className="flex items-center gap-2">
                        <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} />
                        {String(label)}
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      Completion animation
                      <select name="completion_animation" defaultValue={lesson.completion_animation ?? 'progress-ring'} className="h-9 rounded-lg border px-2">
                        <option value="none">None</option>
                        <option value="progress-ring">Progress ring</option>
                        <option value="confetti">Confetti</option>
                        <option value="unlock">Unlock</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2">
                      Threshold %
                      <Input name="required_completion_percentage" type="number" min="0" max="100" defaultValue={lesson.required_completion_percentage ?? 80} className="h-8 w-20 rounded-lg" />
                    </label>
                    <Button formAction={deleteCourseLessonAction.bind(null, lesson.id, id)} size="sm" variant="destructive" className="rounded-xl">
                      Delete
                    </Button>
                  </div>
                </form>
              ))}

              <form action={createCourseLessonFormAction.bind(null, id, module.id)} className="rounded-xl border border-dashed p-3">
                <div className="grid gap-3 xl:grid-cols-[80px_1fr_150px_190px_120px_auto]">
                  <Input name="sort_order" type="number" placeholder="Order" className="rounded-xl" />
                  <Input name="title" placeholder="New lesson title" required className="rounded-xl" />
                  <select name="lesson_type" defaultValue="video" className="rounded-xl border px-3 py-2 text-sm">
                    {LESSON_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select name="reading_type" defaultValue="" className="rounded-xl border px-3 py-2 text-sm">
                    {READING_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <Input name="duration_minutes" type="number" placeholder="Minutes" className="rounded-xl" />
                  <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">Add Lesson</Button>
                </div>
                <Textarea name="description" placeholder="Lesson description" className="mt-3 rounded-xl" rows={2} />
                <Textarea
                  name="article_content"
                  placeholder="Official licensed reading content for rich article, flipbook or slides"
                  className="mt-3 rounded-xl"
                  rows={3}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input name="thumbnail_url" placeholder="Lesson thumbnail URL" className="rounded-xl" />
                  <Input name="video_url" placeholder="External video URL" className="rounded-xl" />
                  <Input name="material_url" placeholder="Material URL" className="rounded-xl" />
                  <Input name="reading_external_url" placeholder="Reading/PDF/slide URL" className="rounded-xl" />
                  <Input name="practice_prompt" placeholder="Practice prompt" className="rounded-xl" />
                  <Input name="discussion_prompt" placeholder="Discussion prompt" className="rounded-xl" />
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
                <input type="hidden" name="confetti_enabled" value="on" />
                <input type="hidden" name="published" value="on" />
              </form>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Resources</h2>
        <form action={uploadCourseResourceFormAction.bind(null, id)} encType="multipart/form-data" className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input name="title" required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <Input name="file" type="file" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>External URL</Label>
            <Input name="external_url" placeholder="https://..." className="rounded-xl" />
          </div>
          <Textarea name="description" placeholder="Description" className="rounded-xl lg:col-span-3" />
          <div className="grid gap-3 sm:grid-cols-4 lg:col-span-3">
            <Input name="sort_order" type="number" placeholder="Order" className="rounded-xl" />
            <select name="visibility" defaultValue="enrolled" className="rounded-xl border px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="enrolled">Enrolled</option>
              <option value="paid">Paid</option>
              <option value="admin">Admin</option>
            </select>
            <select name="scope" defaultValue="course" className="rounded-xl border px-3 py-2 text-sm">
              <option value="course">Course</option>
              <option value="module">Module</option>
              <option value="lesson">Lesson</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </select>
            <Button type="submit" className="rounded-xl bg-[#1D4ED8]"><FileUp className="mr-2 h-4 w-4" /> Save Resource</Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm lg:col-span-3">
            <label><input type="checkbox" name="is_downloadable" defaultChecked className="mr-2" /> Downloadable</label>
            <label><input type="checkbox" name="is_view_only" className="mr-2" /> View only</label>
            <label><input type="checkbox" name="is_compulsory" className="mr-2" /> Compulsory</label>
          </div>
        </form>

        <div className="mt-5 space-y-2">
          {data.resources.map((resource: any) => (
            <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
              <div>
                <p className="font-medium">{resource.title}</p>
                <p className="text-xs text-muted-foreground">{resource.visibility} · {resource.original_filename ?? resource.external_url ?? 'metadata only'}</p>
              </div>
              <div className="flex items-center gap-2">
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
