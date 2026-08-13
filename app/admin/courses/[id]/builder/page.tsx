import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  createCourseLessonFormAction,
  createCourseModuleFormAction,
  createCourseQuizFormAction,
  createQuizQuestionFormAction,
  deleteCourseLessonAction,
  deleteCourseModuleAction,
  deleteCourseQuizAction,
  deleteQuizQuestionAction,
  deleteCourseResourceAction,
  getAdminCourseLms,
  updateCourseLessonFormAction,
  updateCourseModuleFormAction,
  updateCourseQuizFormAction,
  updateCourseResourceFormAction,
  updateQuizQuestionFormAction,
  uploadCourseResourceFormAction,
} from '@/actions/admin/lms'
import {
  updateCourseArchiveStatusAction,
  updateCourseCatalogVisibilityAction,
  updateCourseCertificateSettingsAction,
  updateCourseMediaAction,
  updateCoursePublishStatusAction,
} from '@/actions/admin/courses'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CourseMediaUpload } from '@/components/admin/course-media-upload'
import { RichTextarea } from '@/components/admin/rich-textarea'
import { LmsPageHeader, LmsStatusBadge } from '@/components/lms/lms-primitives'
import {
  ArrowLeft,
  Archive,
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileQuestion,
  FileUp,
  Layers3,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  Wallet,
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

const QUIZ_QUESTION_TYPES = [
  ['mcq', 'Multiple Choice'],
  ['multiple_select', 'Multiple Select'],
  ['true_false', 'True / False'],
  ['fill_blank', 'Fill in the Blank'],
  ['short_answer', 'Short Answer'],
  ['long_answer', 'Long Answer'],
]

const RESOURCE_TYPES = [
  ['file', 'General File'],
  ['worksheet_pdf', 'Worksheet PDF'],
  ['audio', 'Audio'],
  ['blending_audio', 'Blending Audio'],
  ['segmenting_audio', 'Segmenting Audio'],
  ['pronunciation_audio', 'Pronunciation Audio'],
  ['video', 'Video'],
  ['song_video', 'Song Video'],
  ['action_video', 'Action Video'],
  ['formation_video', 'Formation Video'],
  ['pdf', 'PDF'],
  ['image', 'Image'],
  ['link', 'External Link'],
]

const LESSON_TOGGLES = [
  ['is_preview', 'Previewable'],
  ['is_compulsory', 'Required'],
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
  ['confetti_enabled', 'Completion animation'],
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

const steps = [
  ['basic', 'Basic Information'],
  ['media', 'Course Media'],
  ['curriculum', 'Curriculum'],
  ['pricing', 'Pricing and Access'],
  ['completion', 'Certificate and Completion'],
  ['publish', 'Preview and Publish'],
]

function field(label: string, child: ReactNode, hint?: string) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {child}
      {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  )
}

function selectedLessonValue(lesson: Record<string, unknown>, name: string) {
  return lesson[name] === undefined || lesson[name] === null ? LESSON_TOGGLE_DEFAULTS[name] ?? false : Boolean(lesson[name])
}

function StepSection({
  id,
  number,
  title,
  description,
  icon,
  children,
}: {
  id: string
  number: number
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Step {number}</p>
            <h2 className="mt-1 text-xl font-bold text-[#0F172A]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}

function DeleteDialog({
  title,
  description,
  action,
  triggerLabel = 'Delete',
}: {
  title: string
  description: string
  action: any
  triggerLabel?: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive" className="rounded-xl">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" className="rounded-xl">
                Delete
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function StepNav() {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Builder steps</p>
        <nav className="space-y-1" aria-label="Course builder steps">
          {steps.map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F8FAFC] text-xs font-bold text-[#1D4ED8]">
                {index + 1}
              </span>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function visibilityLabel(course: any) {
  if (course.archived || course.visibility_status === 'archived') return 'archived'
  if (!course.published || course.visibility_status === 'draft') return 'draft'
  if (course.unlisted || course.visibility_status === 'unlisted') return 'hidden from Courses page'
  return 'listed publicly'
}

function visibilityTone(course: any): 'green' | 'gold' | 'red' | 'navy' {
  if (course.archived || course.visibility_status === 'archived') return 'red'
  if (!course.published || course.visibility_status === 'draft') return 'gold'
  if (course.unlisted || course.visibility_status === 'unlisted') return 'navy'
  return 'green'
}

export default async function AdminCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAdminCourseLms(id)
  if (!data.course) notFound()

  const modules = [...data.modules].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const lessons = modules.flatMap((module: any) => module.course_lessons ?? [])
  const lessonCount = lessons.length
  const draftAction = updateCoursePublishStatusAction.bind(null, id, false)
  const publishAction = updateCoursePublishStatusAction.bind(null, id, true)
  const hideFromCatalogAction = updateCourseCatalogVisibilityAction.bind(null, id, false)
  const showInCatalogAction = updateCourseCatalogVisibilityAction.bind(null, id, true)
  const archiveAction = updateCourseArchiveStatusAction.bind(null, id, true)
  const restoreAction = updateCourseArchiveStatusAction.bind(null, id, false)

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepNav />

      <div className="min-w-0 space-y-6">
        <LmsPageHeader
          eyebrow="Course Builder"
          title={data.course.title}
          description="Build the course in focused steps. Changes are not autosaved, so use the Save buttons before leaving a section."
          meta={(
            <div className="flex flex-wrap items-center gap-2">
              <LmsStatusBadge tone={data.course.published ? 'green' : 'gold'}>
                {data.course.published ? 'published' : 'draft'}
              </LmsStatusBadge>
              <LmsStatusBadge tone={visibilityTone(data.course)}>
                {visibilityLabel(data.course)}
              </LmsStatusBadge>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
                {modules.length} modules
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
                {lessonCount} lessons
              </Badge>
            </div>
          )}
          action={(
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href={`/admin/courses/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Course settings
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href={`/courses/${data.course.slug}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View public page
                </Link>
              </Button>
            </div>
          )}
        />

        <StepSection
          id="basic"
          number={1}
          title="Basic Information"
          description="Review the public course identity before building lessons."
          icon={<BookOpen className="h-5 w-5" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</p>
              <p className="mt-2 font-semibold text-[#0F172A]">{data.course.title}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</p>
              <p className="mt-2 font-semibold text-[#0F172A]">{data.course.slug}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructor</p>
              <p className="mt-2 font-semibold text-[#0F172A]">{data.course.instructor ?? 'Phonics Club'}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4 rounded-xl border-slate-200 bg-white">
            <Link href={`/admin/courses/${id}`}>Edit basic details</Link>
          </Button>
        </StepSection>

        <StepSection
          id="media"
          number={2}
          title="Course Media"
          description="Upload, preview, replace or remove course thumbnails and media using the existing storage workflow."
          icon={<FileUp className="h-5 w-5" />}
        >
          <form action={updateCourseMediaAction.bind(null, id)} className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <CourseMediaUpload
                name="image_url"
                label="Course Thumbnail"
                defaultValue={data.course.image_url ?? ''}
                folder="courses/thumbnails"
                kind="image"
              />
              <CourseMediaUpload
                name="thumbnail_url"
                label="Catalogue Thumbnail"
                defaultValue={data.course.thumbnail_url ?? data.course.image_url ?? ''}
                folder="courses/thumbnails"
                kind="image"
              />
              <CourseMediaUpload
                name="banner_url"
                label="Course Banner"
                defaultValue={data.course.banner_url ?? ''}
                folder="courses/banners"
                kind="image"
              />
              <CourseMediaUpload
                name="hero_video_url"
                label="Preview Video"
                defaultValue={data.course.hero_video_url ?? ''}
                folder="courses/videos"
                kind="video"
              />
            </div>
            <Button type="submit" className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              <Save className="mr-2 h-4 w-4" />
              Save Media
            </Button>
          </form>
        </StepSection>

        <StepSection
          id="curriculum"
          number={3}
          title="Curriculum"
          description="Create modules, reorder them with sort order, add lessons, attach resources and configure requirements."
          icon={<Layers3 className="h-5 w-5" />}
        >
          <form action={createCourseModuleFormAction.bind(null, id)} className="rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#1D4ED8]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">Create Module</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_110px]">
              {field('Module Title', <Input name="title" placeholder="Introduction to Jolly Phonics" required className="rounded-xl bg-white" />)}
              {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl bg-white" />)}
            </div>
            <div className="mt-4">
              {field('Description', <Textarea name="description" placeholder="What this module covers" className="rounded-xl bg-white" rows={2} />)}
            </div>
            <div className="mt-4">
              <CourseMediaUpload name="thumbnail_url" label="Module Thumbnail" folder={`courses/${id}/modules`} kind="image" />
            </div>
            <input type="hidden" name="transition_style" value="fade" />
            <input type="hidden" name="unlock_animation" value="progress-ring" />
            <Button type="submit" className="mt-4 rounded-xl bg-[#1D4ED8]">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </form>

          {modules.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
              <h3 className="text-xl font-bold">No modules yet</h3>
              <p className="mt-2 text-sm text-slate-500">Add the first module, then add lessons inside it.</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={modules.map((module: any) => module.id)} className="mt-5 space-y-4">
              {modules.map((module: any, moduleIndex: number) => {
                const moduleLessons = [...(module.course_lessons ?? [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

                return (
                  <AccordionItem key={module.id} value={module.id} className="rounded-2xl border border-slate-200 bg-white px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-left">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Module {moduleIndex + 1}</span>
                        <span className="mt-1 block text-lg font-bold text-[#0F172A]">{module.title}</span>
                        <span className="mt-1 block text-sm font-normal text-slate-500">{moduleLessons.length} lessons</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-5">
                      <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <form action={updateCourseModuleFormAction.bind(null, module.id, id)}>
                          <div className="grid gap-4 lg:grid-cols-[110px_1fr]">
                            {field('Order', <Input name="sort_order" type="number" defaultValue={module.sort_order} className="rounded-xl bg-white" />)}
                            {field('Module Title', <Input name="title" defaultValue={module.title} className="rounded-xl bg-white font-semibold" />)}
                          </div>
                          <div className="mt-4">
                            {field('Description', <Textarea name="description" defaultValue={module.description ?? ''} className="rounded-xl bg-white" rows={2} />)}
                          </div>
                          <div className="mt-4">
                            <CourseMediaUpload name="thumbnail_url" label="Module Thumbnail" defaultValue={module.thumbnail_url ?? ''} folder={`courses/${id}/modules`} kind="image" />
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {field(
                              'Transition',
                              <select name="transition_style" defaultValue={module.transition_style ?? 'fade'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                {MODULE_TRANSITIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>,
                            )}
                            {field(
                              'Unlock Animation',
                              <select name="unlock_animation" defaultValue={module.unlock_animation ?? 'progress-ring'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                {UNLOCK_ANIMATIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>,
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                              <Save className="mr-2 h-4 w-4" />
                              Save Module
                            </Button>
                          </div>
                        </form>
                        <div className="mt-2">
                          <DeleteDialog
                            title="Delete module?"
                            description="This removes the module record. Remove linked lessons first if your database requires it."
                            action={deleteCourseModuleAction.bind(null, module.id, id)}
                            triggerLabel="Delete Module"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {moduleLessons.map((lesson: any) => (
                          <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <Badge className="mb-2 rounded-full bg-[#1D4ED8] text-white">Lesson {lesson.sort_order || 1}</Badge>
                                <h3 className="text-lg font-semibold text-[#0F172A]">{lesson.title}</h3>
                              </div>
                              <DeleteDialog
                                title="Delete lesson?"
                                description="This permanently removes the lesson and its progress links may no longer resolve."
                                action={deleteCourseLessonAction.bind(null, lesson.id, id)}
                              />
                            </div>

                            <form action={updateCourseLessonFormAction.bind(null, lesson.id, id)} className="space-y-4">
                              <div className="grid gap-3 lg:grid-cols-[90px_1fr_160px_120px_180px]">
                                {field('Order', <Input name="sort_order" type="number" defaultValue={lesson.sort_order} className="rounded-xl" />)}
                                {field('Title', <Input name="title" defaultValue={lesson.title} className="rounded-xl" />)}
                                {field('Type', <LessonTypeSelect defaultValue={lesson.lesson_type ?? 'video'} />)}
                                {field('Minutes', <Input name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? 0} className="rounded-xl" />)}
                                {field('Completion', <CompletionSelect defaultValue={lesson.completion_mode ?? 'manual'} />)}
                              </div>
                              {field('Lesson Description', <Textarea name="description" defaultValue={lesson.description ?? ''} className="rounded-xl" rows={2} />)}
                              <div className="grid gap-4 lg:grid-cols-2">
                                <CourseMediaUpload name="thumbnail_url" label="Lesson Thumbnail" defaultValue={lesson.thumbnail_url ?? ''} folder={`courses/${id}/lessons`} kind="image" />
                                <CourseMediaUpload name="video_url" label="Lesson Video" defaultValue={lesson.video_url ?? ''} folder={`courses/${id}/videos`} kind="video" />
                              </div>
                              <div className="grid gap-3 lg:grid-cols-3">
                                {field('Reading Mode', <ReadingTypeSelect defaultValue={lesson.reading_type ?? ''} />)}
                                {field('Material URL', <Input name="material_url" defaultValue={lesson.material_url ?? ''} placeholder="PDF, worksheet or download URL" className="rounded-xl" />)}
                                {field('Reading/PDF URL', <Input name="reading_external_url" defaultValue={lesson.reading_external_url ?? ''} className="rounded-xl" />)}
                                {field('Live Session URL', <Input name="live_session_url" defaultValue={lesson.live_session_url ?? ''} className="rounded-xl" />)}
                                {field('External Lesson Link', <Input name="external_link_url" defaultValue={lesson.external_link_url ?? ''} className="rounded-xl" />)}
                              </div>
                              <Accordion type="single" collapsible>
                                <AccordionItem value="content-settings" className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4">
                                  <AccordionTrigger className="hover:no-underline">
                                    <span className="flex items-center gap-2 font-semibold">
                                      <Settings2 className="h-4 w-4 text-[#1D4ED8]" />
                                      Full reading content and requirements
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent className="space-y-4 pb-4">
                                    <div className="grid gap-3 lg:grid-cols-2">
                                      {field('Full Reading Content', <RichTextarea name="rich_content" defaultValue={lesson.rich_content ?? lesson.content ?? ''} className="rounded-xl bg-white" rows={7} />)}
                                      {field('Article Content', <RichTextarea name="article_content" defaultValue={lesson.article_content ?? ''} className="rounded-xl bg-white" rows={7} />)}
                                      {field('Practice Prompt', <Textarea name="practice_prompt" defaultValue={lesson.practice_prompt ?? ''} className="rounded-xl bg-white" rows={3} />)}
                                      {field('Discussion Prompt', <Textarea name="discussion_prompt" defaultValue={lesson.discussion_prompt ?? ''} className="rounded-xl bg-white" rows={3} />)}
                                      {field('Interactive Activity JSON', <Textarea name="activity_data" defaultValue={JSON.stringify(lesson.activity_data ?? {}, null, 2)} className="rounded-xl bg-white font-mono text-xs leading-5 lg:col-span-2" rows={10} />)}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                      {LESSON_TOGGLES.map(([name, label]) => (
                                        <label key={name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                          <input type="checkbox" name={name} defaultChecked={selectedLessonValue(lesson, name)} />
                                          {label}
                                        </label>
                                      ))}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {field('Completion Animation', <CompletionAnimationSelect defaultValue={lesson.completion_animation ?? 'progress-ring'} />)}
                                      {field('Threshold %', <Input name="required_completion_percentage" type="number" min="0" max="100" defaultValue={lesson.required_completion_percentage ?? 80} className="rounded-xl bg-white" />)}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                              <Button type="submit" className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                                <Save className="mr-2 h-4 w-4" />
                                Save Lesson
                              </Button>
                            </form>
                          </div>
                        ))}

                        <form action={createCourseLessonFormAction.bind(null, id, module.id)} className="rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4">
                          <div className="mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#1D4ED8]" />
                            <h3 className="text-lg font-semibold">Add Lesson</h3>
                          </div>
                          <div className="grid gap-3 lg:grid-cols-[90px_1fr_160px_120px]">
                            {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl bg-white" />)}
                            {field('Title', <Input name="title" placeholder="Welcome" required className="rounded-xl bg-white" />)}
                            {field('Type', <LessonTypeSelect defaultValue="video" />)}
                            {field('Minutes', <Input name="duration_minutes" type="number" placeholder="10" className="rounded-xl bg-white" />)}
                          </div>
                          <div className="mt-3">{field('Lesson Description', <Textarea name="description" className="rounded-xl bg-white" rows={2} />)}</div>
                          <div className="mt-3 grid gap-4 lg:grid-cols-2">
                            <CourseMediaUpload name="thumbnail_url" label="Lesson Thumbnail" folder={`courses/${id}/lessons`} kind="image" />
                            <CourseMediaUpload name="video_url" label="Lesson Video" folder={`courses/${id}/videos`} kind="video" />
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-3">
                            {field('Reading Mode', <ReadingTypeSelect defaultValue="" />)}
                            {field('Material URL', <Input name="material_url" placeholder="PDF, worksheet or download URL" className="rounded-xl bg-white" />)}
                            {field('Reading/PDF URL', <Input name="reading_external_url" className="rounded-xl bg-white" />)}
                            {field('Full Reading Content', <RichTextarea name="rich_content" className="rounded-xl bg-white lg:col-span-3" rows={5} />)}
                            {field('Interactive Activity JSON', <Textarea name="activity_data" className="rounded-xl bg-white font-mono text-xs leading-5 lg:col-span-3" rows={7} />)}
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
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}

          <CourseResources courseId={id} modules={modules} resources={data.resources} />
          <CourseQuizzes courseId={id} modules={modules} quizzes={data.quizzes} questions={data.questions} />
        </StepSection>

        <StepSection
          id="pricing"
          number={4}
          title="Pricing and Access"
          description="Pricing, enrolment dates and access rules are saved from course settings."
          icon={<Wallet className="h-5 w-5" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Price" value={Number(data.course.price) === 0 ? 'Free' : `${data.course.currency ?? 'PKR'} ${data.course.price}`} />
            <SummaryCard label="Max students" value={data.course.max_students ?? 'No limit'} />
            <SummaryCard label="Access days" value={data.course.access_duration_days ?? 90} />
          </div>
          <Button asChild variant="outline" className="mt-4 rounded-xl border-slate-200 bg-white">
            <Link href={`/admin/courses/${id}`}>Edit pricing and access</Link>
          </Button>
        </StepSection>

        <StepSection
          id="completion"
          number={5}
          title="Certificate and Completion"
          description="Certificate availability and completion requirements stay connected to the existing course settings."
          icon={<Award className="h-5 w-5" />}
        >
          <form action={updateCourseCertificateSettingsAction.bind(null, id)} className="mb-5 grid gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
                <input type="checkbox" name="certificate_enabled" defaultChecked={data.course.certificate_enabled !== false} />
                This course has a certificate
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="certificate_requires_payment"
                  defaultChecked={Boolean(data.course.certificate_requires_payment ?? data.course.metadata?.certificateRequiresPayment)}
                />
                Certificate requires separate payment
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="completion_requires_lessons" defaultChecked={data.course.completion_requires_lessons !== false} />
                Require compulsory lessons
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="completion_requires_quiz" defaultChecked={data.course.completion_requires_quiz !== false} />
                Unlock certificate only after final quiz
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="completion_requires_active_enrollment" defaultChecked={data.course.completion_requires_active_enrollment !== false} />
                Require active course access
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="completion_requires_instructor_approval" defaultChecked={Boolean(data.course.completion_requires_instructor_approval)} />
                Require instructor approval
              </label>
              {field('Passing Quiz %', <Input name="passing_quiz_percentage" type="number" min="0" max="100" defaultValue={data.course.passing_quiz_percentage ?? 70} className="rounded-xl bg-white" />)}
              {field(
                'Certificate Price',
                <Input
                  name="certificate_price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={data.course.certificate_price ?? Number(data.course.metadata?.certificatePrice ?? 0)}
                  className="rounded-xl bg-white"
                />,
                `Uses ${data.course.currency ?? 'PKR'} for certificate checkout.`,
              )}
            </div>
            <CourseMediaUpload
              name="certificate_background_url"
              label="Certificate Template / Background"
              defaultValue={data.course.certificate_background_url ?? ''}
              folder={`courses/${id}/certificates`}
              kind="image"
            />
            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
                <Save className="mr-2 h-4 w-4" />
                Save Certificate Settings
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href={`/course/${id}/certificate?preview=admin`}>Preview Certificate Page</Link>
              </Button>
            </div>
          </form>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Certificate" value={data.course.certificate_enabled === false ? 'Disabled' : 'Enabled'} />
            <SummaryCard
              label="Certificate payment"
              value={data.course.certificate_requires_payment ? `${data.course.currency ?? 'PKR'} ${data.course.certificate_price ?? 0}` : 'Not required'}
            />
            <SummaryCard label="Instructor approval" value={data.course.completion_requires_instructor_approval ? 'Required' : 'Not required'} />
          </div>
          <p className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm leading-6 text-[#1D4ED8]">
            Certificates use the learner profile name. If a name or certificate detail needs correction, email support@phonicsclub.com.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-xl border-slate-200 bg-white">
            <Link href={`/admin/courses/${id}`}>Edit completion settings</Link>
          </Button>
        </StepSection>

        <StepSection
          id="publish"
          number={6}
          title="Preview and Publish"
          description="Preview the public page, save as draft or publish after checking the curriculum."
          icon={<CheckCircle2 className="h-5 w-5" />}
        >
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
              <Link href={`/courses/${data.course.slug}`}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Course
              </Link>
            </Button>
            <form action={draftAction}>
              <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                Save as Draft
              </Button>
            </form>
            <form action={publishAction}>
              <Button type="submit" className="rounded-xl bg-[#8B1E2D] hover:bg-[#8B1E2D]/90">
                Publish Course
              </Button>
            </form>
            {data.course.unlisted || data.course.visibility_status === 'unlisted' ? (
              <form action={showInCatalogAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <Eye className="mr-2 h-4 w-4" />
                  Show on Courses Page
                </Button>
              </form>
            ) : (
              <form action={hideFromCatalogAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide from Courses Page
                </Button>
              </form>
            )}
            {data.course.archived || data.course.visibility_status === 'archived' ? (
              <form action={restoreAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              </form>
            ) : (
              <form action={archiveAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </form>
            )}
          </div>
        </StepSection>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-[#0F172A]">{value}</p>
    </div>
  )
}

function LessonTypeSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="lesson_type" defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
      {LESSON_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  )
}

function ReadingTypeSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="reading_type" defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
      {READING_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  )
}

function CompletionSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="completion_mode" defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
      <option value="manual">Manual</option>
      <option value="content_threshold">Content threshold</option>
      <option value="video_threshold">Video threshold</option>
    </select>
  )
}

function CompletionAnimationSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="completion_animation" defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <option value="none">None</option>
      <option value="progress-ring">Progress ring</option>
      <option value="confetti">Confetti</option>
      <option value="unlock">Unlock</option>
    </select>
  )
}

function CourseResources({ courseId, modules, resources }: { courseId: string; modules: any[]; resources: any[] }) {
  const resourceAccept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,.mov'

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileUp className="h-5 w-5 text-[#1D4ED8]" />
        <h3 className="text-lg font-bold text-[#0F172A]">Uploads and Resources</h3>
      </div>
      <form action={uploadCourseResourceFormAction.bind(null, courseId)} className="grid gap-4 lg:grid-cols-3">
        {field('Title', <Input name="title" required className="rounded-xl" />)}
        {field('Resource Type', <ResourceTypeSelect />)}
        {field('File', <Input name="file" type="file" accept={resourceAccept} className="rounded-xl" />, 'Upload worksheets, PDFs, images, MP3/WAV/M4A audio, MP4/WebM/MOV video, Office files or ZIP resources.')}
        {field('External URL', <Input name="external_url" placeholder="https://..." className="rounded-xl" />)}
        <div className="lg:col-span-3">{field('Description', <Textarea name="description" className="rounded-xl" rows={2} />)}</div>
        {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
        {field('Visibility', <VisibilitySelect />)}
        {field('Scope', <ScopeSelect />)}
        {field('Attach to Module', <ModuleSelect modules={modules} />)}
        {field('Attach to Lesson', <LessonSelect modules={modules} />)}
        <div className="flex flex-wrap gap-4 text-sm lg:col-span-3">
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_downloadable" defaultChecked /> Downloadable</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_view_only" /> View only</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_compulsory" /> Compulsory</label>
        </div>
        <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:w-fit">
          <FileUp className="mr-2 h-4 w-4" />
          Save Resource
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {resources.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No resources uploaded yet.</p>}
        {resources.map((resource: any) => (
          <div key={resource.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{resource.title}</p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{resource.visibility ?? 'enrolled'}</span>
                  <span>/</span>
                  <span>{resource.original_filename ?? resource.external_url ?? 'metadata only'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {resource.external_url ? <Link2 className="h-4 w-4 text-[#1D4ED8]" /> : null}
                {resource.is_compulsory && <Badge>Compulsory</Badge>}
                <DeleteDialog
                  title="Delete resource?"
                  description="This removes the resource record and any stored file linked to it."
                  action={deleteCourseResourceAction.bind(null, resource.id, courseId)}
                />
              </div>
            </div>
            <form
              action={updateCourseResourceFormAction.bind(null, resource.id, courseId)}
              className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-3"
            >
              {field('Title', <Input name="title" required defaultValue={resource.title ?? ''} className="rounded-xl" />)}
              {field('Resource Type', <ResourceTypeSelect defaultValue={resource.resource_type ?? 'file'} />)}
              {field('Replace File', <Input name="file" type="file" accept={resourceAccept} className="rounded-xl" />)}
              {field('External URL', <Input name="external_url" defaultValue={resource.external_url ?? resource.resource_url ?? ''} placeholder="https://..." className="rounded-xl" />)}
              <div className="lg:col-span-3">{field('Description', <Textarea name="description" defaultValue={resource.description ?? ''} className="rounded-xl" rows={2} />)}</div>
              {field('Order', <Input name="sort_order" type="number" defaultValue={resource.sort_order ?? 0} className="rounded-xl" />)}
              {field('Visibility', <VisibilitySelect defaultValue={resource.visibility ?? 'enrolled'} />)}
              {field('Scope', <ScopeSelect defaultValue={resource.scope ?? 'course'} />)}
              {field('Attach to Module', <ModuleSelect modules={modules} defaultValue={resource.module_id ?? ''} />)}
              {field('Attach to Lesson', <LessonSelect modules={modules} defaultValue={resource.lesson_id ?? ''} />)}
              <div className="flex flex-wrap gap-4 text-sm lg:col-span-3">
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_downloadable" defaultChecked={resource.is_downloadable !== false} /> Downloadable</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_view_only" defaultChecked={Boolean(resource.is_view_only)} /> View only</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="is_compulsory" defaultChecked={Boolean(resource.is_compulsory)} /> Compulsory</label>
              </div>
              <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white lg:w-fit">
                <Save className="mr-2 h-4 w-4" />
                Save Resource
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}

function linesValue(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).join('\n') : ''
}

function numbersValue(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => Number(item) + 1).filter((item) => Number.isFinite(item)).join(', ')
    : ''
}

function moduleLessons(module: any) {
  return (module.course_lessons ?? module.lessons ?? []) as any[]
}

function quizPlacementLabel(quiz: any, modules: any[]) {
  if (quiz.lesson_id) {
    for (const module of modules) {
      const lesson = moduleLessons(module).find((item) => item.id === quiz.lesson_id)
      if (lesson) return `Lesson: ${module.title} - ${lesson.title}`
    }
    return 'Lesson attached'
  }
  if (quiz.module_id) {
    const module = modules.find((item) => item.id === quiz.module_id)
    return module ? `Module end: ${module.title}` : 'Module attached'
  }
  return 'Course final quiz'
}

function CourseQuizzes({
  courseId,
  modules,
  quizzes,
  questions,
}: {
  courseId: string
  modules: any[]
  quizzes: any[]
  questions: any[]
}) {
  const questionsByQuiz = new Map<string, any[]>()
  questions.forEach((question) => {
    const rows = questionsByQuiz.get(question.quiz_id) ?? []
    rows.push(question)
    questionsByQuiz.set(question.quiz_id, rows)
  })

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileQuestion className="h-5 w-5 text-[#1D4ED8]" />
        <h3 className="text-lg font-bold text-[#0F172A]">Quizzes</h3>
      </div>
      <form action={createCourseQuizFormAction.bind(null, courseId)} className="grid gap-4 lg:grid-cols-4">
        {field('Quiz Title', <Input name="title" required className="rounded-xl" />)}
        {field('Attach to Module', <ModuleSelect modules={modules} />)}
        {field('Attach to Lesson', <LessonSelect modules={modules} name="lesson_id" />)}
        {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
        <div className="lg:col-span-4">{field('Description', <Textarea name="description" className="rounded-xl" rows={2} />)}</div>
        {field('Passing Score %', <Input name="passing_score" type="number" min="0" max="100" defaultValue="70" className="rounded-xl" />)}
        {field('Max Attempts', <Input name="max_attempts" type="number" min="1" defaultValue="3" className="rounded-xl" />)}
        {field('Timer Minutes', <Input name="timer_minutes" type="number" min="0" className="rounded-xl" />)}
        <div className="flex flex-wrap gap-4 text-sm lg:col-span-4">
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="randomize_questions" /> Randomize questions</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="randomize_options" /> Randomize options</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="show_explanations" defaultChecked /> Show explanations</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="allow_review" defaultChecked /> Allow review</label>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="published" defaultChecked /> Published</label>
        </div>
        <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:w-fit">
          <Plus className="mr-2 h-4 w-4" />
          Add Quiz
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {quizzes.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No quizzes created yet.</p>}
        {quizzes.map((quiz: any) => (
          <div key={quiz.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{quiz.title}</p>
                <p className="text-xs text-slate-500">Passing score {quiz.passing_score}% / {quiz.max_attempts} attempts</p>
                <p className="mt-1 text-xs font-semibold text-[#1D4ED8]">{quizPlacementLabel(quiz, modules)}</p>
              </div>
              <div className="flex items-center gap-2">
                <LmsStatusBadge tone={quiz.published ? 'green' : 'gold'}>{quiz.published ? 'published' : 'draft'}</LmsStatusBadge>
                <DeleteDialog
                  title="Delete quiz?"
                  description="This removes the quiz record. Existing attempts may no longer resolve."
                  action={deleteCourseQuizAction.bind(null, quiz.id, courseId)}
                />
              </div>
            </div>

            <form action={updateCourseQuizFormAction.bind(null, quiz.id, courseId)} className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-4">
              {field('Quiz Title', <Input name="title" required defaultValue={quiz.title ?? ''} className="rounded-xl" />)}
              {field('Attach to Module', <ModuleSelect modules={modules} defaultValue={quiz.module_id ?? ''} />)}
              {field('Attach to Lesson', <LessonSelect modules={modules} name="lesson_id" defaultValue={quiz.lesson_id ?? ''} />)}
              {field('Order', <Input name="sort_order" type="number" defaultValue={quiz.sort_order ?? 0} className="rounded-xl" />)}
              <div className="lg:col-span-4">{field('Description', <Textarea name="description" defaultValue={quiz.description ?? ''} className="rounded-xl" rows={2} />)}</div>
              {field('Passing Score %', <Input name="passing_score" type="number" min="0" max="100" defaultValue={quiz.passing_score ?? 70} className="rounded-xl" />)}
              {field('Max Attempts', <Input name="max_attempts" type="number" min="1" defaultValue={quiz.max_attempts ?? 3} className="rounded-xl" />)}
              {field('Timer Minutes', <Input name="timer_minutes" type="number" min="0" defaultValue={quiz.timer_minutes ?? ''} className="rounded-xl" />)}
              <div className="flex flex-wrap gap-4 text-sm lg:col-span-4">
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="randomize_questions" defaultChecked={Boolean(quiz.randomize_questions)} /> Randomize questions</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="randomize_options" defaultChecked={Boolean(quiz.randomize_options)} /> Randomize options</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="show_explanations" defaultChecked={quiz.show_explanations !== false} /> Show explanations</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="allow_review" defaultChecked={quiz.allow_review !== false} /> Allow review</label>
                <label className="flex items-center gap-2 rounded-lg border px-3 py-2"><input type="checkbox" name="published" defaultChecked={quiz.published !== false} /> Published</label>
              </div>
              <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white lg:w-fit">
                <Save className="mr-2 h-4 w-4" />
                Save Quiz
              </Button>
            </form>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="font-semibold text-[#0F172A]">Add Question</h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                MCQ answers use 1 for the first option, 2 for the second, and so on. Short/fill answers can use acceptable answers, one per line.
              </p>
              <form action={createQuizQuestionFormAction.bind(null, quiz.id, courseId)} className="mt-4 grid gap-4 lg:grid-cols-4">
                <div className="lg:col-span-2">{field('Question', <Textarea name="question" required className="rounded-xl" rows={3} />)}</div>
                {field('Type', <QuestionTypeSelect />)}
                {field('Order', <Input name="sort_order" type="number" placeholder="1" className="rounded-xl" />)}
                <div className="lg:col-span-2">{field('Options', <Textarea name="options" className="rounded-xl" rows={4} placeholder="One option per line" />)}</div>
                {field('Correct Option', <Input name="correct_option" type="number" min="1" defaultValue="1" className="rounded-xl" />, 'For MCQ/true-false.')}
                {field('Correct Options', <Input name="correct_options" placeholder="1, 3" className="rounded-xl" />, 'For multiple select.')}
                <div className="lg:col-span-2">{field('Acceptable Answers', <Textarea name="acceptable_answers" className="rounded-xl" rows={3} placeholder="One accepted answer per line" />)}</div>
                <div className="lg:col-span-2">{field('Explanation', <Textarea name="explanation" className="rounded-xl" rows={3} />)}</div>
                {field('Points', <Input name="points" type="number" min="1" defaultValue="1" className="rounded-xl" />)}
                {field('Difficulty', <DifficultySelect />)}
                <div className="lg:col-span-2">{field('Media URL', <Input name="media_url" className="rounded-xl" placeholder="Optional image, audio or video URL" />)}</div>
                <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:w-fit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </form>
            </div>

            <div className="mt-4 space-y-3">
              {(questionsByQuiz.get(quiz.id) ?? []).length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  This quiz has no questions yet.
                </p>
              )}
              {(questionsByQuiz.get(quiz.id) ?? []).map((question) => (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <form action={updateQuizQuestionFormAction.bind(null, question.id, courseId)} className="grid gap-4 lg:grid-cols-4">
                    <div className="lg:col-span-2">{field('Question', <Textarea name="question" required defaultValue={question.question ?? ''} className="rounded-xl" rows={3} />)}</div>
                    {field('Type', <QuestionTypeSelect defaultValue={question.question_type ?? 'mcq'} />)}
                    {field('Order', <Input name="sort_order" type="number" defaultValue={question.sort_order ?? 0} className="rounded-xl" />)}
                    <div className="lg:col-span-2">{field('Options', <Textarea name="options" defaultValue={linesValue(question.options)} className="rounded-xl" rows={4} />)}</div>
                    {field('Correct Option', <Input name="correct_option" type="number" min="1" defaultValue={Number(question.correct_option ?? 0) + 1} className="rounded-xl" />)}
                    {field('Correct Options', <Input name="correct_options" defaultValue={numbersValue(question.correct_options)} className="rounded-xl" />)}
                    <div className="lg:col-span-2">{field('Acceptable Answers', <Textarea name="acceptable_answers" defaultValue={linesValue(question.acceptable_answers)} className="rounded-xl" rows={3} />)}</div>
                    <div className="lg:col-span-2">{field('Explanation', <Textarea name="explanation" defaultValue={question.explanation ?? ''} className="rounded-xl" rows={3} />)}</div>
                    {field('Points', <Input name="points" type="number" min="1" defaultValue={question.points ?? 1} className="rounded-xl" />)}
                    {field('Difficulty', <DifficultySelect defaultValue={question.difficulty ?? 'standard'} />)}
                    <div className="lg:col-span-2">{field('Media URL', <Input name="media_url" defaultValue={question.media_url ?? question.image_url ?? question.audio_url ?? ''} className="rounded-xl" />)}</div>
                    <div className="flex flex-wrap gap-2 lg:col-span-4">
                      <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
                        <Save className="mr-2 h-4 w-4" />
                        Save Question
                      </Button>
                    </div>
                  </form>
                  <div className="mt-3">
                    <DeleteDialog
                      title="Delete question?"
                      description="This removes the question from this quiz. Existing attempts keep their stored answers, but this question will no longer appear."
                      action={deleteQuizQuestionAction.bind(null, question.id, courseId)}
                      triggerLabel="Delete Question"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestionTypeSelect({ defaultValue = 'mcq' }: { defaultValue?: string }) {
  return (
    <select name="question_type" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      {QUIZ_QUESTION_TYPES.map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}

function DifficultySelect({ defaultValue = 'standard' }: { defaultValue?: string }) {
  return (
    <select name="difficulty" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      <option value="easy">Easy</option>
      <option value="standard">Standard</option>
      <option value="hard">Hard</option>
    </select>
  )
}

function VisibilitySelect({ defaultValue = 'enrolled' }: { defaultValue?: string }) {
  return (
    <select name="visibility" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      <option value="public">Public</option>
      <option value="enrolled">Enrolled</option>
      <option value="paid">Paid</option>
      <option value="admin">Admin</option>
    </select>
  )
}

function ResourceTypeSelect({ defaultValue = 'file' }: { defaultValue?: string }) {
  return (
    <select name="resource_type" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      {RESOURCE_TYPES.map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}

function ScopeSelect({ defaultValue = 'course' }: { defaultValue?: string }) {
  return (
    <select name="scope" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      <option value="course">Course</option>
      <option value="module">Module</option>
      <option value="lesson">Lesson</option>
      <option value="quiz">Quiz</option>
      <option value="assignment">Assignment</option>
    </select>
  )
}

function ModuleSelect({ modules, defaultValue = '' }: { modules: any[]; defaultValue?: string }) {
  return (
    <select name="module_id" defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      <option value="">Whole course</option>
      {modules.map((module: any) => <option key={module.id} value={module.id}>{module.title}</option>)}
    </select>
  )
}

function LessonSelect({ modules, name = 'lesson_id', defaultValue = '' }: { modules: any[]; name?: string; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="w-full rounded-xl border px-3 py-2 text-sm">
      <option value="">No lesson</option>
      {modules.flatMap((module: any) => moduleLessons(module).map((lesson: any) => (
        <option key={lesson.id} value={lesson.id}>{module.title} - {lesson.title}</option>
      )))}
    </select>
  )
}
