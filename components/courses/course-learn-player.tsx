'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers3,
  Link2,
  ListChecks,
  Lock,
  Menu,
  PanelTop,
  PlayCircle,
  Sparkles,
  UploadCloud,
  Video,
  Volume2,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getSignedCourseResourceAction,
  markLessonCompleteAction,
  recordLearningHeartbeatAction,
  startLearningSessionAction,
  submitOfflineActivityAction,
} from '@/actions/lms'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { jollyActivityForLesson } from '@/lib/data/jolly-phonics-sound-data'
import { cn } from '@/lib/utils'
import type { Course, CourseLesson, CourseQuiz, CourseResource, LessonProgress, LessonReadingType } from '@/types/database'
import type { CourseModuleWithLessons } from '@/lib/lms'

interface Props {
  course: Course
  modules: CourseModuleWithLessons[]
  progressItems: LessonProgress[]
  resources: CourseResource[]
  quizzes: CourseQuiz[]
  initialProgress: number
  previewMode?: boolean
}

type LessonWithModule = CourseLesson & {
  moduleId: string
  moduleTitle: string
  moduleIndex: number
  lessonIndex: number
  globalIndex: number
}

function embedUrl(url: string | null | undefined) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{6,})/)
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url
}

function formatLessonType(type: string | null | undefined) {
  if (!type) return 'Lesson'
  if (type === 'pdf') return 'PDF'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getReadingMode(lesson: CourseLesson): LessonReadingType {
  return lesson.reading_type ?? (
    lesson.lesson_type === 'pdf' ? 'pdf_viewer' :
    lesson.lesson_type === 'flipbook' ? 'flipbook' :
    lesson.lesson_type === 'presentation' ? 'powerpoint_slides' :
    lesson.lesson_type === 'interactive' ? 'interactive_presentation' :
    'rich_article'
  )
}

function getLessonText(lesson: CourseLesson) {
  return lesson.article_content || lesson.rich_content || lesson.content || lesson.description || ''
}

function lessonSourceUrl(lesson: CourseLesson) {
  return lesson.reading_external_url || lesson.material_url || lesson.external_link_url || lesson.live_session_url || null
}

function lessonHasQuiz(lesson: CourseLesson, quizzes: CourseQuiz[]) {
  return quizzes.some((quiz) => quiz.lesson_id === lesson.id)
}

function getModuleLessons(lessons: LessonWithModule[], moduleId: string | undefined) {
  return lessons.filter((lesson) => lesson.moduleId === moduleId)
}

function isLastLessonInModule(lesson: LessonWithModule, lessons: LessonWithModule[]) {
  const moduleLessons = getModuleLessons(lessons, lesson.moduleId)
  return moduleLessons[moduleLessons.length - 1]?.id === lesson.id
}

function getQuizzesForLesson(lesson: LessonWithModule | undefined, lessons: LessonWithModule[], quizzes: CourseQuiz[]) {
  if (!lesson) return []
  const isFinalLesson = lesson.globalIndex === lessons.length - 1
  return quizzes.filter((quiz) => {
    if (quiz.lesson_id) return quiz.lesson_id === lesson.id
    if (quiz.module_id) return quiz.module_id === lesson.moduleId && isLastLessonInModule(lesson, lessons)
    return isFinalLesson
  })
}

function lessonHasPlacedQuiz(lesson: LessonWithModule, lessons: LessonWithModule[], quizzes: CourseQuiz[]) {
  return getQuizzesForLesson(lesson, lessons, quizzes).length > 0
}

function quizHref(courseId: string, quizId: string | undefined, previewMode: boolean) {
  const params = new URLSearchParams()
  if (quizId) params.set('quizId', quizId)
  if (previewMode) params.set('preview', 'admin')
  const query = params.toString()
  return `/course/${courseId}/quiz${query ? `?${query}` : ''}`
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function lessonHasAttachedContent(lesson: CourseLesson) {
  return Boolean(
    lesson.video_url ||
    lesson.material_url ||
    lesson.reading_external_url ||
    lesson.external_link_url ||
    lesson.live_session_url ||
    lesson.article_content ||
    lesson.rich_content ||
    lesson.content ||
    Object.keys(asRecord(lesson.presentation_data)).length,
  )
}

function isContentRequiredLesson(lesson: CourseLesson) {
  const activityData = asRecord(lesson.activity_data)
  if (jollyActivityForLesson(lesson.title, activityData)) return false
  const isChildShell =
    activityData.childActivityShell === true ||
    activityData.contentStatus === 'content_required'

  return isChildShell && !lessonHasAttachedContent(lesson)
}

function LessonTypeIcon({
  lesson,
  hasQuiz,
  className,
}: {
  lesson: CourseLesson
  hasQuiz?: boolean
  className?: string
}) {
  const Icon =
    hasQuiz || lesson.lesson_type === 'quiz' ? HelpCircle :
    lesson.lesson_type === 'video' ? Video :
    lesson.lesson_type === 'pdf' ? FileText :
    lesson.lesson_type === 'download' ? Download :
    lesson.lesson_type === 'presentation' || lesson.lesson_type === 'interactive' ? PanelTop :
    lesson.lesson_type === 'external_link' || lesson.lesson_type === 'live_class' ? ExternalLink :
    BookOpenText

  return <Icon className={cn('h-4 w-4 shrink-0', className)} aria-hidden="true" />
}

function EmptyLessons() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <FileText className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-[#0F172A]">No lessons are available yet</h1>
      <p className="mt-2 text-slate-500">Please check back after the instructor publishes lessons.</p>
    </div>
  )
}

export function CourseLearnPlayer({
  course,
  modules,
  progressItems,
  resources,
  quizzes,
  initialProgress,
  previewMode = false,
}: Props) {
  const lessons = useMemo<LessonWithModule[]>(
    () => modules.flatMap((module, moduleIndex) =>
      module.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
        moduleIndex,
        lessonIndex,
        globalIndex: 0,
      })),
    ).map((lesson, globalIndex) => ({ ...lesson, globalIndex })),
    [modules],
  )
  const initialCompleted = useMemo(
    () => new Set(progressItems.filter((item) => item.completed).map((item) => item.lesson_id)),
    [progressItems],
  )
  const firstIncomplete = lessons.find((lesson) => !initialCompleted.has(lesson.id)) ?? lessons[0]
  const [activeLessonId, setActiveLessonId] = useState(firstIncomplete?.id ?? lessons[0]?.id)
  const [completed, setCompleted] = useState(initialCompleted)
  const [progress, setProgress] = useState(initialProgress)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [detailsCollapsed, setDetailsCollapsed] = useState(true)
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false)
  const [completionBurst, setCompletionBurst] = useState(false)
  const [pending, startTransition] = useTransition()
  const lastActivityRef = useRef(Date.now())
  const sessionIdRef = useRef<string | null>(null)

  const activeIndex = Math.max(lessons.findIndex((lesson) => lesson.id === activeLessonId), 0)
  const activeLesson = lessons[activeIndex]
  const activeModuleId = activeLesson?.moduleId
  const [openModules, setOpenModules] = useState<string[]>(() => activeModuleId ? [activeModuleId] : modules.slice(0, 1).map((module) => module.id))

  const activeLessonResources = resources.filter((resource) => resource.lesson_id === activeLesson?.id)
  const courseResources = resources.filter((resource) => !resource.lesson_id)
  const activeResources = [...activeLessonResources, ...courseResources]
  const lessonQuizzes = getQuizzesForLesson(activeLesson, lessons, quizzes)
  const quizRequiredLessons = activeLesson && lessonQuizzes.length
    ? lessonQuizzes.some((quiz) => !quiz.lesson_id && !quiz.module_id)
      ? lessons
      : lessonQuizzes.some((quiz) => !quiz.lesson_id && quiz.module_id)
        ? getModuleLessons(lessons, activeLesson.moduleId)
        : []
    : []
  const lockedQuizLessonCount = previewMode ? 0 : quizRequiredLessons.filter((lesson) => !completed.has(lesson.id)).length
  const quizLocked = lockedQuizLessonCount > 0
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length
  const sourceUrl = activeLesson ? lessonSourceUrl(activeLesson) : null
  const showInfoPanel = Boolean(
    activeLesson?.duration_minutes ||
    activeResources.length ||
    lessonQuizzes.length ||
    activeLesson?.external_link_url ||
    activeLesson?.live_session_url ||
    activeLesson?.material_url ||
    activeLesson?.completion_mode === 'content_threshold' ||
    activeLesson?.completion_mode === 'video_threshold' ||
    activeLesson?.is_compulsory === false,
  )

  useEffect(() => {
    if (activeModuleId && !openModules.includes(activeModuleId)) {
      setOpenModules((current) => [...current, activeModuleId])
    }
  }, [activeModuleId, openModules])

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now()
    }
    window.addEventListener('mousemove', markActivity)
    window.addEventListener('keydown', markActivity)
    window.addEventListener('scroll', markActivity, { passive: true })
    window.addEventListener('click', markActivity)
    return () => {
      window.removeEventListener('mousemove', markActivity)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('scroll', markActivity)
      window.removeEventListener('click', markActivity)
    }
  }, [])

  useEffect(() => {
    if (previewMode || !activeLesson?.id || activeLesson.id.startsWith('curriculum-')) return

    let cancelled = false
    const storedDeviceId = window.localStorage.getItem('phonics-lms-device-id') || crypto.randomUUID()
    window.localStorage.setItem('phonics-lms-device-id', storedDeviceId)

    startTransition(async () => {
      const result = await startLearningSessionAction({
        courseId: course.id,
        lessonId: activeLesson.id,
        deviceId: storedDeviceId,
      })
      if (!cancelled && result.success && result.data?.sessionId) {
        sessionIdRef.current = result.data.sessionId
      }
    })

    const interval = window.setInterval(() => {
      const sessionId = sessionIdRef.current
      if (!sessionId) return
      const recentlyActive = Date.now() - lastActivityRef.current < 4 * 60 * 1000
      void recordLearningHeartbeatAction({
        sessionId,
        heartbeatId: crypto.randomUUID(),
        courseId: course.id,
        lessonId: activeLesson.id,
        visible: document.visibilityState === 'visible',
        focused: document.hasFocus(),
        active: recentlyActive,
        route: window.location.pathname,
        clientSentAt: new Date().toISOString(),
      })
    }, 60_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      sessionIdRef.current = null
    }
  }, [activeLesson?.id, course.id, previewMode])

  function isLocked(index: number) {
    if (previewMode) return false
    if (index === 0) return false
    const lesson = lessons[index]
    if (lesson?.sequentially_locked === false) return false
    const previousLesson = lessons[index - 1]
    return previousLesson ? !completed.has(previousLesson.id) : false
  }

  function chooseLesson(lessonId: string, index: number) {
    if (isLocked(index)) {
      toast.info('Complete the previous lesson first')
      return
    }
    setActiveLessonId(lessonId)
    setMobileCurriculumOpen(false)
  }

  function goToOffset(offset: -1 | 1) {
    const nextIndex = activeIndex + offset
    const nextLesson = lessons[nextIndex]
    if (!nextLesson) return
    chooseLesson(nextLesson.id, nextIndex)
  }

  function markComplete() {
    if (!activeLesson) return
    if (previewMode) {
      toast.info('Preview mode does not save student progress')
      return
    }
    startTransition(async () => {
      const result = await markLessonCompleteAction(course.id, activeLesson.id)
      if (result.success && result.data) {
        const nextCompleted = new Set(completed)
        nextCompleted.add(activeLesson.id)
        setCompleted(nextCompleted)
        setProgress(result.data.progress)
        setCompletionBurst(true)
        window.setTimeout(() => setCompletionBurst(false), 1800)
        toast.success(result.data.progress >= 100 ? 'Course completed' : 'Lesson completed')
      } else {
        toast.error(result.error ?? 'Progress could not be saved')
      }
    })
  }

  function openResource(resource: CourseResource) {
    const directUrl = resource.external_url || resource.resource_url
    if (directUrl && !resource.storage_path) {
      window.open(directUrl, '_blank', 'noopener,noreferrer')
      return
    }

    startTransition(async () => {
      const result = await getSignedCourseResourceAction(resource.id)
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(result.error ?? 'Unable to open resource')
      }
    })
  }

  if (!activeLesson) return <EmptyLessons />

  const readingMode = getReadingMode(activeLesson)
  const video = embedUrl(activeLesson.video_url)
  const activeDone = completed.has(activeLesson.id)
  const nextLocked = activeIndex >= lessons.length - 1 || isLocked(activeIndex + 1)
  const canOpenSource = Boolean(sourceUrl)
  const contentRequired = isContentRequiredLesson(activeLesson)

  const desktopCurriculum = (
    <CurriculumSidebar
      course={course}
      modules={modules}
      lessons={lessons}
      quizzes={quizzes}
      progress={progress}
      completed={completed}
      completedCount={completedCount}
      activeLessonId={activeLessonId}
      openModules={openModules}
      onOpenModulesChange={setOpenModules}
      isLocked={isLocked}
      onChooseLesson={chooseLesson}
      collapsed={sidebarCollapsed}
      onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
    />
  )
  const mobileCurriculum = (
    <CurriculumSidebar
      course={course}
      modules={modules}
      lessons={lessons}
      quizzes={quizzes}
      progress={progress}
      completed={completed}
      completedCount={completedCount}
      activeLessonId={activeLessonId}
      openModules={openModules}
      onOpenModulesChange={setOpenModules}
      isLocked={isLocked}
      onChooseLesson={chooseLesson}
      collapsed={false}
      onToggleCollapsed={() => undefined}
    />
  )

  const lessonInfoPanel = showInfoPanel ? (
    <LessonInfoPanel
      lesson={activeLesson}
      moduleTitle={activeLesson.moduleTitle}
      resources={activeResources}
      quizzes={lessonQuizzes}
      courseId={course.id}
      sourceUrl={sourceUrl}
      previewMode={previewMode}
      quizLocked={quizLocked}
      lockedQuizLessonCount={lockedQuizLessonCount}
      collapsed={detailsCollapsed}
      onToggleCollapsed={() => setDetailsCollapsed((value) => !value)}
    />
  ) : null

  return (
    <div className="pc-course-workspace space-y-4 pb-24 lg:pb-2">
      <header className="pc-course-header rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-slate-600 hover:text-[#1D4ED8]">
                <Link href="/">
                  <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                  Back to Website
                </Link>
              </Button>
              <Badge variant="outline" className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]">
                {previewMode ? 'Admin preview' : 'Learning workspace'}
              </Badge>
            </div>
            <h1 className="mt-2 line-clamp-1 text-xl font-bold tracking-normal text-[#0F172A] sm:text-2xl">
              {course.title}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="pc-course-progress rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 sm:min-w-[180px]">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Overall progress</span>
                <span className="text-[#0F172A]">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Sheet open={mobileCurriculumOpen} onOpenChange={setMobileCurriculumOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="rounded-xl border-slate-200 bg-white lg:hidden">
                  <Menu className="mr-2 h-4 w-4" aria-hidden="true" />
                  Curriculum
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px] max-w-[92vw] overflow-y-auto bg-white p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Course curriculum</SheetTitle>
                  <SheetDescription>Choose a course module or lesson.</SheetDescription>
                </SheetHeader>
                {mobileCurriculum}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'pc-course-layout grid gap-4',
          sidebarCollapsed
            ? showInfoPanel
              ? detailsCollapsed
                ? 'lg:grid-cols-[84px_minmax(0,1fr)] 2xl:grid-cols-[84px_minmax(0,1fr)_76px]'
                : 'lg:grid-cols-[84px_minmax(0,1fr)] 2xl:grid-cols-[84px_minmax(0,1fr)_280px]'
              : 'lg:grid-cols-[84px_minmax(0,1fr)]'
            : showInfoPanel
              ? detailsCollapsed
                ? 'lg:grid-cols-[310px_minmax(0,1fr)] 2xl:grid-cols-[310px_minmax(0,1fr)_76px]'
                : 'lg:grid-cols-[310px_minmax(0,1fr)] 2xl:grid-cols-[310px_minmax(0,1fr)_280px]'
              : 'lg:grid-cols-[310px_minmax(0,1fr)]',
        )}
      >
        <aside className="hidden lg:block">{desktopCurriculum}</aside>

        <main key={activeLesson.id} className="pc-course-main min-w-0 space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
          {!previewMode && <OfflineMinutesPanel course={course} />}

          <section className="pc-course-card pc-course-player-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {completionBurst && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
                <div className="mt-4 rounded-full border border-[#FDE68A] bg-white px-4 py-2 text-sm font-bold text-[#8B1E2D] shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                  <Sparkles className="mr-2 inline h-4 w-4 text-[#FBBF24]" aria-hidden="true" />
                  Lesson complete. Progress updated.
                </div>
              </div>
            )}

            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{activeLesson.moduleTitle}</span>
                <span aria-hidden="true">/</span>
                <span>Lesson {activeIndex + 1} of {lessons.length}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-normal text-[#0F172A] sm:text-3xl">
                    {activeLesson.title}
                  </h2>
                  {activeLesson.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{activeLesson.description}</p>
                  )}
                </div>
                <Badge className="w-fit rounded-full bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#EFF6FF]">
                  <LessonTypeIcon lesson={activeLesson} hasQuiz={lessonHasPlacedQuiz(activeLesson, lessons, quizzes)} className="mr-1" />
                  {formatLessonType(activeLesson.lesson_type)}
                </Badge>
              </div>
            </div>

            <LessonContent
              lesson={activeLesson}
              readingMode={readingMode}
              videoUrl={video}
              sourceUrl={sourceUrl}
              courseId={course.id}
              quizzes={lessonQuizzes}
              quizLocked={quizLocked}
              lockedQuizLessonCount={lockedQuizLessonCount}
              contentRequired={contentRequired}
              previewMode={previewMode}
            />

            {activeResources.length > 0 && (
              <ResourcesSection resources={activeResources} pending={pending} onOpenResource={openResource} />
            )}

            {canOpenSource && activeLesson.lesson_type === 'download' && (
              <div className="border-t border-slate-200 bg-[#F8FAFC] p-5 sm:p-6">
                <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <a href={sourceUrl ?? '#'} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    Open Lesson Material
                  </a>
                </Button>
              </div>
            )}

            <LessonActions
              activeDone={activeDone}
              pending={pending}
              activeIndex={activeIndex}
              totalLessons={lessons.length}
              nextLocked={nextLocked}
              onPrevious={() => goToOffset(-1)}
              onNext={() => goToOffset(1)}
              onComplete={markComplete}
              completeDisabled={contentRequired || previewMode}
              completeDisabledLabel={previewMode ? 'Preview only' : 'Content pending'}
            />
          </section>

          {lessonInfoPanel && <div className="2xl:hidden">{lessonInfoPanel}</div>}
        </main>

        {lessonInfoPanel && <aside className="hidden 2xl:block">{lessonInfoPanel}</aside>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 border-t border-slate-200 bg-white p-3 shadow-lg lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          disabled={activeIndex === 0}
          onClick={() => goToOffset(-1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 rounded-xl bg-[#8B1E2D] hover:bg-[#8B1E2D]/90"
          disabled={pending || activeDone || contentRequired || previewMode}
          onClick={markComplete}
        >
          {activeDone ? 'Done' : previewMode ? 'Preview' : contentRequired ? 'Pending' : 'Complete'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          disabled={nextLocked}
          onClick={() => goToOffset(1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function OfflineMinutesPanel({ course }: { course: Course }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const requiredMinutes = Number(course.required_offline_minutes ?? 0)
  const maxEntryMinutes = Number(course.max_offline_entry_minutes ?? 360)
  const evidenceRequired = Boolean(course.offline_evidence_required)

  function submitOfflineMinutes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await submitOfflineActivityAction(formData)
      if (result.success) {
        form.reset()
        setOpen(false)
        setSubmitted(true)
        toast.success('Offline minutes submitted for admin review')
      } else {
        setSubmitted(false)
        toast.error(result.error ?? 'Offline minutes could not be submitted')
      }
    })
  }

  return (
    <section className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1D4ED8]">Offline minutes</p>
            <h2 className="text-lg font-bold tracking-normal text-[#0F172A]">Upload offline minutes</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Submit classroom practice or learning time completed away from the online player.
            </p>
            {submitted && (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Submitted for admin review.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {requiredMinutes > 0 && (
            <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-slate-600">
              {requiredMinutes} min required
            </span>
          )}
          <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-slate-600">
            Max {maxEntryMinutes} min per entry
          </span>
          <Button
            type="button"
            variant={open ? 'outline' : 'default'}
            className={open ? 'rounded-xl border-slate-200 bg-white' : 'rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Hide form' : 'Add minutes'}
          </Button>
        </div>
      </div>

      {open && (
        <form ref={formRef} onSubmit={submitOfflineMinutes} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 lg:grid-cols-6">
          <input type="hidden" name="course_id" value={course.id} />
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-2">
            Date
            <Input name="activity_date" type="date" required max={today} className="h-10 rounded-xl bg-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
            Start
            <Input name="start_time" type="time" required className="h-10 rounded-xl bg-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
            End
            <Input name="end_time" type="time" required className="h-10 rounded-xl bg-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-2">
            Activity
            <select
              name="activity_type"
              required
              defaultValue=""
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
            >
              <option value="" disabled>Select activity</option>
              <option value="classroom_practice">Classroom practice</option>
              <option value="home_practice">Home practice</option>
              <option value="assignment">Assignment work</option>
              <option value="reading_practice">Reading practice</option>
              <option value="other">Other learning activity</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-3">
            Evidence file {evidenceRequired ? '*' : '(optional)'}
            <Input
              name="evidence_file"
              type="file"
              required={evidenceRequired}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.zip"
              className="h-10 rounded-xl bg-white file:mr-3 file:rounded-lg file:bg-[#EFF6FF] file:px-3 file:text-[#1D4ED8]"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-3">
            Notes
            <Textarea name="description" rows={3} placeholder="What did you complete offline?" className="rounded-xl bg-white" />
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm text-slate-600 lg:col-span-4">
            <input type="checkbox" name="student_declaration" required />
            I confirm this offline activity entry is accurate.
          </label>
          <Button type="submit" disabled={pending} className="h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 lg:col-span-2">
            <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
            {pending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </form>
      )}
    </section>
  )
}

function CurriculumSidebar({
  course,
  modules,
  lessons,
  quizzes,
  progress,
  completed,
  completedCount,
  activeLessonId,
  openModules,
  onOpenModulesChange,
  isLocked,
  onChooseLesson,
  collapsed,
  onToggleCollapsed,
}: {
  course: Course
  modules: CourseModuleWithLessons[]
  lessons: LessonWithModule[]
  quizzes: CourseQuiz[]
  progress: number
  completed: Set<string>
  completedCount: number
  activeLessonId: string | undefined
  openModules: string[]
  onOpenModulesChange: (value: string[]) => void
  isLocked: (index: number) => boolean
  onChooseLesson: (lessonId: string, index: number) => void
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  if (collapsed) {
    return (
      <div className="pc-course-curriculum pc-course-curriculum-collapsed sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="mb-3 h-10 w-10 rounded-xl"
          onClick={onToggleCollapsed}
          aria-label="Expand curriculum sidebar"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="mb-4 rounded-xl bg-[#EFF6FF] p-2 text-center">
          <p className="text-xs font-bold text-[#1D4ED8]">{progress}%</p>
          <Progress value={progress} className="mt-2 h-1.5" />
        </div>
        <div className="space-y-2 overflow-y-auto pb-10">
          {lessons.map((lesson, index) => {
            const locked = isLocked(index)
            const active = activeLessonId === lesson.id
            const done = completed.has(lesson.id)
            const hasQuiz = lessonHasPlacedQuiz(lesson, lessons, quizzes)
            return (
              <button
                key={lesson.id}
                type="button"
                disabled={locked}
                title={lesson.title}
                aria-label={lesson.title}
                aria-current={active ? 'step' : undefined}
                onClick={() => onChooseLesson(lesson.id, index)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]',
                  active && 'border-[#1D4ED8] bg-[#1D4ED8] text-white',
                  !active && !locked && 'border-slate-200 bg-white hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                  locked && 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300',
                  done && !active && 'border-emerald-200 bg-emerald-50 text-emerald-600',
                )}
              >
                {locked ? <Lock className="h-4 w-4" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <LessonTypeIcon lesson={lesson} hasQuiz={hasQuiz} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="pc-course-curriculum sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Course curriculum</p>
            <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#0F172A]">{course.title}</h2>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="hidden h-9 w-9 shrink-0 rounded-xl lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label="Collapse curriculum sidebar"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{completedCount}/{lessons.length} lessons complete</span>
            <span className="text-[#0F172A]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="h-[calc(100%-132px)] overflow-y-auto px-3 pb-10 pt-3">
        <Accordion type="multiple" value={openModules} onValueChange={onOpenModulesChange} className="space-y-2">
          {modules.map((module, moduleIndex) => (
            <AccordionItem key={module.id} value={module.id} className="rounded-xl border border-slate-200 bg-white px-3">
              <AccordionTrigger className="py-3 text-left hover:no-underline">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-500">Module {moduleIndex + 1}</span>
                  <span className="mt-0.5 block line-clamp-2 text-sm font-bold text-[#0F172A]">{module.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-1.5">
                  {module.lessons.map((lesson) => {
                    const lessonWithModule = lessons.find((item) => item.id === lesson.id)
                    const index = lessonWithModule?.globalIndex ?? 0
                    const locked = isLocked(index)
                    const active = activeLessonId === lesson.id
                    const done = completed.has(lesson.id)
                    const hasQuiz = lessonWithModule ? lessonHasPlacedQuiz(lessonWithModule, lessons, quizzes) : lessonHasQuiz(lesson, quizzes)
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => onChooseLesson(lesson.id, index)}
                          aria-current={active ? 'step' : undefined}
                          className={cn(
                            'group flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]',
                            active && 'bg-[#1D4ED8] text-white',
                            !active && !locked && 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                            locked && 'cursor-not-allowed text-slate-400 opacity-70',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white',
                              active ? 'border-white/20 text-[#1D4ED8]' : done ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-500',
                              locked && 'text-slate-300',
                            )}
                          >
                            {locked ? <Lock className="h-3.5 w-3.5" /> : done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LessonTypeIcon lesson={lesson} hasQuiz={hasQuiz} className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium leading-5">{lesson.title}</span>
                            <span className={cn('mt-1 flex flex-wrap items-center gap-1.5 text-[11px]', active ? 'text-white/80' : 'text-slate-400')}>
                              <span>{formatLessonType(lesson.lesson_type)}</span>
                              {hasQuiz && (
                                <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5', active ? 'bg-white/15 text-white' : 'bg-[#FFFBEB] text-[#92400E]')}>
                                  <HelpCircle className="h-3 w-3" aria-hidden="true" />
                                  Quiz
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

function LessonContent({
  lesson,
  readingMode,
  videoUrl,
  sourceUrl,
  courseId,
  quizzes,
  quizLocked,
  lockedQuizLessonCount,
  contentRequired,
  previewMode,
}: {
  lesson: CourseLesson
  readingMode: LessonReadingType
  videoUrl: string | null
  sourceUrl: string | null
  courseId: string
  quizzes: CourseQuiz[]
  quizLocked: boolean
  lockedQuizLessonCount: number
  contentRequired: boolean
  previewMode: boolean
}) {
  const content = getLessonText(lesson)
  const showVideo = lesson.lesson_type === 'video' || Boolean(videoUrl)
  const showQuiz = quizzes.length > 0
  const showExternal = lesson.lesson_type === 'external_link' || lesson.lesson_type === 'live_class'
  const primaryQuiz = quizzes[0]
  const jollyActivity = jollyActivityForLesson(lesson.title, asRecord(lesson.activity_data))

  return (
    <div className="space-y-0">
      {showVideo && (
        <div className="pc-course-video-shell border-b border-slate-200 bg-[#0F172A] p-4 sm:p-5">
          <div className="pc-course-video aspect-video overflow-hidden rounded-xl bg-black">
            {videoUrl ? (
              <iframe
                className="h-full w-full"
                src={videoUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <MediaMissingState icon={PlayCircle} title="Video is not attached yet" />
            )}
          </div>
        </div>
      )}

      {showExternal && (
        <div className="border-b border-slate-200 bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1D4ED8]">
                  {lesson.lesson_type === 'live_class' ? 'Live class' : 'External content'}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Open the linked lesson material in a new tab.
                </p>
              </div>
              {sourceUrl ? (
                <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    Open Link
                  </a>
                </Button>
              ) : (
                <Button type="button" className="rounded-xl" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Link Pending
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {contentRequired ? (
        <div className="border-b border-slate-200 bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-dashed border-[#BFDBFE] bg-white p-6 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#FBBF24]" aria-hidden="true" />
            <h3 className="text-xl font-bold text-[#0F172A]">This activity is being prepared</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              The lesson shell is ready, but the instructor still needs to upload approved child-friendly media
              before children can complete it.
            </p>
          </div>
        </div>
      ) : jollyActivity ? (
        <JollyPhonicsLesson activity={jollyActivity} lessonTitle={lesson.title} />
      ) : (
        <ReadingMaterial lesson={lesson} readingMode={readingMode} sourceUrl={sourceUrl} content={content} />
      )}

      {showQuiz && (
        <div className="border-t border-slate-200 bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-[#BFDBFE] bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  Quiz
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#0F172A]">
                  {primaryQuiz?.title ?? 'Course quiz'}
                </h3>
                {primaryQuiz?.description && <p className="mt-1 text-sm leading-6 text-slate-600">{primaryQuiz.description}</p>}
                {quizLocked && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Complete {lockedQuizLessonCount} remaining lesson{lockedQuizLessonCount === 1 ? '' : 's'} to unlock this quiz.
                  </p>
                )}
              </div>
              {quizLocked ? (
                <Button type="button" disabled className="rounded-xl bg-slate-300 text-slate-600 hover:bg-slate-300">
                  <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                  Locked
                </Button>
              ) : (
                <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                  <Link href={quizHref(courseId, primaryQuiz?.id, previewMode)}>
                    Launch Quiz
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadingMaterial({
  lesson,
  readingMode,
  sourceUrl,
  content,
}: {
  lesson: CourseLesson
  readingMode: LessonReadingType
  sourceUrl: string | null
  content: string
}) {
  const isReadingLesson = ['reading', 'notes', 'pdf', 'flipbook', 'presentation', 'interactive'].includes(lesson.lesson_type)
  const shouldShowDocument = Boolean(content) || isReadingLesson

  if (readingMode === 'pdf_viewer') {
    return (
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <ReadingLabel icon={FileText} label="PDF or reading material" />
        {sourceUrl ? (
          <iframe className="mt-4 h-[70vh] min-h-[480px] w-full rounded-xl border border-slate-200 bg-white" src={sourceUrl} title={`${lesson.title} PDF`} />
        ) : content ? (
          <DocumentContent title={lesson.title} content={content} />
        ) : (
          <MediaMissingState icon={FileText} title="Reading material is not attached yet" light />
        )}
        {sourceUrl && content && <DocumentContent title={`${lesson.title} notes`} content={content} />}
      </div>
    )
  }

  if (readingMode === 'flipbook') {
    return (
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <ReadingLabel icon={BookOpen} label="Flipbook" />
        {sourceUrl ? (
          <iframe className="mt-4 h-[70vh] min-h-[480px] w-full rounded-xl border border-slate-200 bg-white" src={sourceUrl} title={`${lesson.title} flipbook`} />
        ) : content ? (
          <DocumentContent title={lesson.title} content={content} />
        ) : (
          <MediaMissingState icon={BookOpen} title="Flipbook material is not attached yet" light />
        )}
      </div>
    )
  }

  if (readingMode === 'powerpoint_slides' || readingMode === 'interactive_presentation') {
    const slides = getPresentationSlides(lesson.presentation_data)
    return (
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <ReadingLabel
          icon={PanelTop}
          label={readingMode === 'powerpoint_slides' ? 'Presentation' : 'Interactive presentation'}
        />
        {sourceUrl ? (
          <iframe className="mt-4 aspect-video w-full rounded-xl border border-slate-200 bg-white" src={sourceUrl} title={`${lesson.title} presentation`} />
        ) : slides.length ? (
          <PresentationSlides slides={slides} />
        ) : content ? (
          <DocumentContent title={lesson.title} content={content} />
        ) : (
          <MediaMissingState icon={PanelTop} title="Presentation content is not attached yet" light />
        )}
      </div>
    )
  }

  if (!shouldShowDocument) return null

  return (
    <div className="border-b border-slate-200 p-5 sm:p-6">
      <ReadingLabel icon={BookOpenText} label="Reading" />
      {content ? (
        <DocumentContent title={lesson.title} content={content} />
      ) : (
        <MediaMissingState icon={BookOpenText} title="Lesson content is not attached yet" light />
      )}
    </div>
  )
}

function ReadingLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </p>
  )
}

function DocumentContent({ title, content }: { title: string; content: string }) {
  const html = /<\/?[a-z][\s\S]*>/i.test(content)

  return (
    <article className="pc-reading-surface mt-4 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-6 text-[#0F172A] shadow-sm sm:px-8 sm:py-8 [&_a]:font-semibold [&_a]:text-[#1D4ED8] [&_blockquote]:border-l-4 [&_blockquote]:border-[#BFDBFE] [&_blockquote]:bg-[#F8FAFC] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-5 [&_img]:rounded-xl [&_img]:border [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-8 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-[#F8FAFC] [&_th]:p-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h3 className="sr-only">{title}</h3>
          {content.split(/\n{2,}/).map((block, index) => (
            <p key={`${title}-${index}`} className="whitespace-pre-wrap">
              {block}
            </p>
          ))}
        </>
      )}
    </article>
  )
}

function getPresentationSlides(data: CourseLesson['presentation_data']) {
  if (!data || typeof data !== 'object') return []
  const slidesValue = (data as Record<string, unknown>).slides
  if (!Array.isArray(slidesValue)) return []
  return slidesValue
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      return {
        id: String(record.id ?? index),
        title: typeof record.title === 'string' ? record.title : `Slide ${index + 1}`,
        body: typeof record.body === 'string' ? record.body : typeof record.content === 'string' ? record.content : '',
        imageUrl: typeof record.image_url === 'string' ? record.image_url : typeof record.imageUrl === 'string' ? record.imageUrl : '',
      }
    })
    .filter((slide): slide is { id: string; title: string; body: string; imageUrl: string } => Boolean(slide))
}

function PresentationSlides({
  slides,
}: {
  slides: Array<{ id: string; title: string; body: string; imageUrl: string }>
}) {
  return (
    <div className="mt-4 space-y-4">
      {slides.map((slide, index) => (
        <article key={slide.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Slide {index + 1}</p>
          <h3 className="mt-2 text-xl font-bold text-[#0F172A]">{slide.title}</h3>
          {slide.imageUrl && <img src={slide.imageUrl} alt="" className="mt-4 max-h-[420px] w-full rounded-xl object-contain" />}
          {slide.body && <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">{slide.body}</p>}
        </article>
      ))}
    </div>
  )
}

type JollyInteractiveActivity = {
  activityKind?: string
  title?: string
  group?: string | number
  mode?: string
  soundKey?: string
  displayGrapheme?: string
  soundLabel?: string
  audioUrl?: string
  flashcardTheme?: string
  action?: string
  formation?: string
  examples?: unknown
  nonExamples?: unknown
  blendingWords?: unknown
  segmentingWords?: unknown
  sounds?: unknown
  words?: unknown
  wordAudioUrls?: unknown
}

type ReviewSound = {
  key: string
  displayGrapheme: string
  soundLabel: string
  audioUrl: string
  examples: string[]
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
}

function reviewSounds(value: unknown): ReviewSound[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const key = String(record.key ?? '').trim()
      const displayGrapheme = String(record.displayGrapheme ?? record.display ?? '').trim()
      if (!key || !displayGrapheme) return null
      return {
        key,
        displayGrapheme,
        soundLabel: String(record.soundLabel ?? '').trim(),
        audioUrl: String(record.audioUrl ?? '').trim(),
        examples: stringList(record.examples),
      }
    })
    .filter((item): item is ReviewSound => Boolean(item))
}

function playAudio(url?: string) {
  if (!url || typeof window === 'undefined') return
  const audio = new Audio(url)
  void audio.play().catch(() => {
    toast.error('Audio could not play')
  })
}

function speakText(text: string, rate = 0.85) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.pitch = 1.08
  window.speechSynthesis.speak(utterance)
}

function playWordAudio(activity: JollyInteractiveActivity, word: string) {
  const audioUrls = asRecord(activity.wordAudioUrls)
  const audioUrl = String(audioUrls[word] ?? audioUrls[word.toLowerCase()] ?? '').trim()
  if (audioUrl) {
    playAudio(audioUrl)
    return
  }
  speakText(word)
}

function themeClasses(theme?: string) {
  if (theme === 'sky') return 'from-[#DFF7FF] via-[#EAFBFF] to-[#F8FDFF] text-[#0F4C81]'
  if (theme === 'forest') return 'from-[#DFF7EA] via-[#F0FFF4] to-[#F8FFF9] text-[#14532D]'
  if (theme === 'mountain') return 'from-[#EAF1FF] via-[#F5F8FF] to-white text-[#1E3A8A]'
  if (theme === 'ocean') return 'from-[#DBF7FF] via-[#E7FAFF] to-[#F5FFFD] text-[#0E7490]'
  return 'from-[#D7F4FC] via-[#EAFBFF] to-[#F7FDFF] text-[#0F172A]'
}

function JollyPhonicsLesson({ activity, lessonTitle }: { activity: JollyInteractiveActivity; lessonTitle: string }) {
  const [earnedStar, setEarnedStar] = useState(false)
  const sounds = reviewSounds(activity.sounds)
  const examples = stringList(activity.examples)
  const nonExamples = stringList(activity.nonExamples)
  const blendingWords = stringList(activity.blendingWords)
  const segmentingWords = stringList(activity.segmentingWords)
  const reviewWords = stringList(activity.words)
  const isReview = activity.activityKind === 'review_station' || sounds.length > 0
  const display = String(activity.displayGrapheme ?? '').trim()
  const label = String(activity.soundLabel ?? '').trim()
  const theme = String(activity.flashcardTheme ?? 'garden')
  const mode = String(activity.mode ?? 'review').replace(/_/g, ' ')
  const reviewCorrectWords = sounds.flatMap((sound) => sound.examples.slice(0, 1))
  const activeWords = isReview ? reviewWords : Array.from(new Set([...examples, ...blendingWords, ...segmentingWords]))
  const certificateTitle = activity.title ?? lessonTitle

  return (
    <section className="border-b border-slate-200 bg-[#F8FAFC] p-4 sm:p-6">
      <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-4 shadow-sm ring-1 ring-slate-200 sm:p-6', themeClasses(theme))}>
        <FlashcardDecor />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.05fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide opacity-75">
                {isReview ? 'Practice deck' : `Sound Group ${activity.group ?? ''}`}
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-normal text-[#0F172A] sm:text-3xl">
                {activity.title ?? lessonTitle}
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                {isReview ? `Mode: ${mode}` : `${label} sound station`}
              </p>
            </div>

            {isReview ? (
              <ReviewFlashcards sounds={sounds} theme={theme} />
            ) : (
              <SoundFlashcard display={display} label={label} audioUrl={activity.audioUrl} theme={theme} />
            )}
          </div>

          <div className="space-y-4">
            {!isReview && (
              <>
                <ActionActivity
                  display={display}
                  label={label}
                  action={String(activity.action ?? '')}
                  audioUrl={activity.audioUrl}
                  onComplete={() => setEarnedStar(true)}
                />
                <FormationActivity
                  display={display}
                  instruction={String(activity.formation ?? '')}
                  onComplete={() => setEarnedStar(true)}
                />
              </>
            )}

            <PictureMatchActivity
              title={isReview ? 'Picture Hunt Review' : 'Picture Hunt'}
              prompt={isReview ? 'Choose the pictures for this review deck.' : `Which pictures match ${label || display}?`}
              correctWords={isReview ? reviewCorrectWords : examples}
              distractorWords={nonExamples}
              onComplete={() => setEarnedStar(true)}
            />

            <SoundPopActivity
              correctWords={isReview ? reviewCorrectWords : examples}
              distractorWords={nonExamples}
              onComplete={() => setEarnedStar(true)}
            />

            <BlendingActivity
              words={activeWords.length ? activeWords : reviewWords}
              activity={activity}
              onComplete={() => setEarnedStar(true)}
            />

            <SegmentingActivity
              words={activeWords.length ? activeWords : reviewWords}
              activity={activity}
              onComplete={() => setEarnedStar(true)}
            />

            <ActivityCertificate
              earned={earnedStar}
              title={certificateTitle}
              onEarn={() => setEarnedStar(true)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FlashcardDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-14 -top-14 h-44 w-44 rounded-full border-[28px] border-cyan-300/55" />
      <div className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full border-[32px] border-cyan-300/50" />
      <div className="pointer-events-none absolute -right-10 top-12 h-36 w-36 rounded-full border-[24px] border-cyan-300/45" />
      <div className="pointer-events-none absolute bottom-8 right-10 h-28 w-28 rounded-full border-[20px] border-cyan-300/45" />
    </>
  )
}

function SoundFlashcard({
  display,
  label,
  audioUrl,
  theme,
}: {
  display: string
  label: string
  audioUrl?: string
  theme: string
}) {
  const isDigraph = display.length > 1

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/82 p-5 shadow-[0_16px_0_rgba(15,23,42,0.13)] ring-1 ring-white/70">
      <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] bg-white/70 sm:min-h-[420px]">
        <span className={cn('font-black leading-none tracking-normal text-[#111318]', isDigraph ? 'text-[clamp(5rem,14vw,12rem)]' : 'text-[clamp(9rem,22vw,17rem)]')}>
          {display || '?'}
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Flashcard</p>
          <p className="text-2xl font-black text-[#0F172A]">{label}</p>
        </div>
        <Button type="button" onClick={() => playAudio(audioUrl)} className={cn('rounded-2xl px-5 py-6 font-bold shadow-sm', theme === 'forest' ? 'bg-[#16A34A] hover:bg-[#15803D]' : theme === 'ocean' ? 'bg-[#0891B2] hover:bg-[#0E7490]' : 'bg-[#1D4ED8] hover:bg-[#1D4ED8]/90')}>
          <Volume2 className="mr-2 h-5 w-5" aria-hidden="true" />
          Hear Sound
        </Button>
      </div>
      {audioUrl && <audio className="mt-4 w-full" controls src={audioUrl} />}
    </div>
  )
}

function ReviewFlashcards({ sounds, theme }: { sounds: ReviewSound[]; theme: string }) {
  if (!sounds.length) return <WordPanel title="Flashcards" words={[]} emptyText="Add review sounds in lesson activity data." />

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sounds.map((sound) => (
        <button
          key={sound.key}
          type="button"
          onClick={() => playAudio(sound.audioUrl)}
          className={cn(
            'min-h-[150px] rounded-3xl bg-white/86 p-4 text-center shadow-sm ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:shadow-md',
            theme === 'forest' ? 'hover:bg-[#F0FDF4]' : theme === 'ocean' ? 'hover:bg-[#ECFEFF]' : 'hover:bg-[#EFF6FF]',
          )}
        >
          <span className={cn('block font-black leading-none text-[#111318]', sound.displayGrapheme.length > 1 ? 'text-6xl' : 'text-7xl')}>
            {sound.displayGrapheme}
          </span>
          <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            {sound.soundLabel || 'Play'}
          </span>
        </button>
      ))}
    </div>
  )
}

const PICTURE_DISTRACTORS = ['dog', 'moon', 'fish', 'sun', 'cat', 'ball', 'robot', 'kite']
const PICTURE_SYMBOLS: Record<string, string> = {
  sun: '\u2600\uFE0F',
  sit: '\uD83E\uDE91',
  sat: '\uD83E\uDE91',
  sip: '\uD83E\uDD64',
  ant: '\uD83D\uDC1C',
  apple: '\uD83C\uDF4E',
  tap: '\uD83D\uDC47',
  top: '\uD83D\uDD1D',
  ink: '\uD83E\uDDC9',
  in: '\u2935',
  pin: '\uD83D\uDCCC',
  pan: '\uD83C\uDF73',
  net: '\uD83E\uDD45',
  nap: '\uD83D\uDE34',
  cat: '\uD83D\uDC31',
  kit: '\uD83E\uDDF0',
  egg: '\uD83E\uDD5A',
  hen: '\uD83D\uDC14',
  hat: '\uD83C\uDFA9',
  rat: '\uD83D\uDC00',
  run: '\uD83C\uDFC3',
  mat: '\uD83E\uDDF5',
  dog: '\uD83D\uDC36',
  goat: '\uD83D\uDC10',
  pot: '\uD83E\uDD58',
  cup: '\u2615',
  leg: '\uD83E\uDDB5',
  fan: '\uD83E\uDEAD',
  bat: '\uD83C\uDFCF',
  rain: '\uD83C\uDF27\uFE0F',
  sail: '\u26F5',
  jam: '\uD83C\uDF53',
  boat: '\uD83D\uDEA4',
  pie: '\uD83E\uDD67',
  bee: '\uD83D\uDC1D',
  fork: '\uD83C\uDF74',
  zip: '\uD83E\uDDF7',
  web: '\uD83D\uDD78\uFE0F',
  ring: '\uD83D\uDC8D',
  van: '\uD83D\uDE90',
  moon: '\uD83C\uDF19',
  book: '\uD83D\uDCD6',
  yes: '\u2713',
  yak: '\uD83D\uDC02',
  yarn: '\uD83E\uDDF6',
  yogurt: '\uD83E\uDD63',
  yell: '\uD83D\uDDE3\uFE0F',
  yard: '\uD83C\uDFE1',
  box: '\uD83D\uDCE6',
  chip: '\uD83C\uDF5F',
  ship: '\uD83D\uDEA2',
  thin: '\uD83D\uDCCF',
  this: '\u261D\uFE0F',
  queen: '\uD83D\uDC51',
  cloud: '\u2601\uFE0F',
  coin: '\uD83E\uDE99',
  blue: '\uD83D\uDD35',
  fern: '\uD83C\uDF3F',
  star: '\u2B50',
  fish: '\uD83D\uDC1F',
  ball: '\u26BD',
  robot: '\uD83E\uDD16',
  kite: '\uD83E\uDE81',
}

function shuffleList<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function ActivityCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/86 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#1D4ED8]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function ActionActivity({
  display,
  label,
  action,
  audioUrl,
  onComplete,
}: {
  display: string
  label: string
  action: string
  audioUrl?: string
  onComplete: () => void
}) {
  const [moving, setMoving] = useState(false)

  function watchAction() {
    setMoving(true)
    window.setTimeout(() => setMoving(false), 1200)
    onComplete()
  }

  return (
    <ActivityCard title="Do the Action">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={watchAction}
          className={cn(
            'flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-[#EFF6FF] text-6xl font-black text-[#1D4ED8] shadow-inner transition',
            moving && 'scale-110 rotate-3 bg-[#FEF3C7] text-[#B91C1C]',
          )}
          aria-label={`Watch action for ${display}`}
        >
          {display || '?'}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-[#0F172A]">{action || `Do the action and say ${label || display}.`}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={watchAction} className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              Watch
            </Button>
            <Button type="button" variant="outline" onClick={() => { playAudio(audioUrl); watchAction() }} className="rounded-xl bg-white">
              <Volume2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Hear and Do
            </Button>
          </div>
        </div>
      </div>
    </ActivityCard>
  )
}

const LETTER_PATHS: Record<string, string[]> = {
  s: ['M186,122 C186,108 150,106 138,118 C126,130 150,138 168,146 C186,154 186,166 168,170 C150,174 128,170 126,156'],
  a: ['M184,140 C184,123 172,110 157,110 C142,110 130,123 130,140 C130,157 142,170 157,170 C172,170 184,157 184,140 L184,170'],
  t: ['M160,68 L160,158 C160,168 168,172 178,168', 'M132,108 L192,108'],
  i: ['M160,112 L160,168'],
  p: ['M135,110 L135,213 M135,110 C152,110 165,123 165,140 C165,157 152,170 135,170'],
  n: ['M130,112 L130,170 M130,125 C130,108 190,108 190,128 L190,170'],
  c: ['M188,120 C174,108 145,108 132,128 C118,150 132,170 158,170 C174,170 186,164 192,154'],
  k: ['M135,66 L135,170 M190,108 L138,142 M148,140 L194,170'],
  e: ['M190,140 L130,140 C130,122 146,110 164,112 C188,116 196,144 180,160 C164,176 134,170 130,148'],
  h: ['M130,66 L130,170 M130,124 C142,108 190,110 190,132 L190,170'],
  r: ['M130,112 L130,170 M130,126 C142,108 168,110 178,124'],
  m: ['M120,112 L120,170 M120,126 C132,108 154,108 160,128 L160,170 M160,128 C174,108 198,110 202,132 L202,170'],
  d: ['M190,66 L190,170 M190,140 C190,123 178,110 162,110 C146,110 134,123 134,140 C134,157 146,170 162,170 C178,170 190,157 190,140'],
  g: ['M184,140 C184,123 172,110 157,110 C142,110 130,123 130,140 C130,157 142,170 157,170 C172,170 184,157 184,140 L184,190 C184,208 164,216 146,204'],
  o: ['M160,110 C178,110 192,124 192,140 C192,158 178,172 160,172 C142,172 128,158 128,140 C128,124 142,110 160,110'],
  u: ['M130,112 L130,150 C130,168 186,168 186,150 L186,112 M186,112 L186,170'],
  l: ['M160,66 L160,170'],
  f: ['M178,68 C146,62 142,92 152,112 L152,170 M126,112 L190,112'],
  b: ['M130,66 L130,170 M130,140 C130,123 144,110 160,110 C178,110 190,123 190,140 C190,157 178,170 160,170 C144,170 130,157 130,140'],
  j: ['M165,112 L165,188 C165,208 132,208 130,188'],
  z: ['M126,112 L190,112 L126,170 L192,170'],
  w: ['M118,112 L136,170 L160,122 L184,170 L204,112'],
  y: ['M122,112 L158,170 M196,112 L158,170 L134,214'],
  x: ['M128,112 L192,170 M192,112 L128,170'],
  q: ['M170,140 C170,123 158,110 142,110 C126,110 114,123 114,140 C114,157 126,170 142,170 C158,170 170,157 170,140 M170,112 L170,214'],
}

function graphemeLetters(display: string) {
  return display.replace('/', '').replace(/\s*\(.+?\)\s*/g, '').split('')
}

function FormationActivity({
  display,
  instruction,
  onComplete,
}: {
  display: string
  instruction: string
  onComplete: () => void
}) {
  const [activeLetterIndex, setActiveLetterIndex] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [watching, setWatching] = useState(false)
  const letters = graphemeLetters(display || '')
  const currentLetter = letters[activeLetterIndex] ?? display[0] ?? '?'

  function watchFormation() {
    setWatching(true)
    speakText(`Watch how to write ${currentLetter}. Start at the green dot and follow the arrow.`)
    window.setTimeout(() => setWatching(false), 1500)
  }

  return (
    <ActivityCard title={`Trace ${display}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-600">{instruction || 'Start at the green dot and follow the dotted path.'}</p>
        <Button type="button" size="sm" onClick={watchFormation} className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
          Watch
        </Button>
      </div>
      {letters.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {letters.map((letter, index) => (
            <button
              key={`${display}-${letter}-${index}`}
              type="button"
              onClick={() => { setActiveLetterIndex(index); setAttempted(false) }}
              className={cn('rounded-full px-4 py-2 text-sm font-black', activeLetterIndex === index ? 'bg-[#1D4ED8] text-white' : 'bg-[#EFF6FF] text-[#1D4ED8]')}
            >
              Trace {letter}
            </button>
          ))}
        </div>
      )}
      <TraceCanvas letter={currentLetter} watching={watching} showGuide onAttempt={() => { setAttempted(true); onComplete() }} />
      {attempted && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#1D4ED8]">Try Yourself</p>
          <TraceCanvas letter={currentLetter} showGuide={false} onAttempt={() => onComplete()} />
        </div>
      )}
      {letters.length > 1 && attempted && activeLetterIndex < letters.length - 1 && (
        <Button type="button" onClick={() => { setActiveLetterIndex((value) => value + 1); setAttempted(false) }} className="mt-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D]">
          Next letter
        </Button>
      )}
      {letters.length > 1 && attempted && activeLetterIndex === letters.length - 1 && (
        <div className="mt-3 rounded-2xl bg-[#DCFCE7] p-3 text-center text-4xl font-black text-[#14532D]">{display}</div>
      )}
    </ActivityCard>
  )
}

function TraceCanvas({
  letter,
  watching = false,
  showGuide,
  onAttempt,
}: {
  letter: string
  watching?: boolean
  showGuide: boolean
  onAttempt: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const paths = LETTER_PATHS[letter.toLowerCase()] ?? []

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    const p = point(event)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = point(event)
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1D4ED8'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  function end() {
    if (!drawingRef.current) return
    drawingRef.current = false
    onAttempt()
  }

  return (
    <div>
      <div className="relative mx-auto h-[220px] max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-inner ring-1 ring-slate-200">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 220" aria-hidden="true">
          {[60, 110, 170, 215].map((y, index) => (
            <line key={y} x1="16" x2="304" y1={y} y2={y} stroke={index === 2 ? '#EF4444' : '#94A3B8'} strokeDasharray={index === 1 ? '8 8' : '4 8'} strokeWidth={index === 2 ? 2 : 1.5} />
          ))}
          {showGuide && paths.map((d, index) => (
            <path key={`${letter}-${index}`} d={d} fill="none" stroke="#38BDF8" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 12" opacity="0.82" />
          ))}
          {showGuide && <circle cx="130" cy="112" r="10" fill="#22C55E" />}
          {showGuide && <polygon points="146,104 166,112 146,120" fill="#F59E0B" className={cn(watching && 'animate-pulse')} />}
          {watching && paths.map((d, index) => (
            <path key={`watch-${letter}-${index}`} d={d} fill="none" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
          ))}
        </svg>
        <canvas
          ref={canvasRef}
          width={320}
          height={220}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-label={`Tracing canvas for ${letter}`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" onClick={() => speakText('Trace the letter. Start at the green dot and follow the arrow.')} className="rounded-xl bg-white">
          <Volume2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Hear instruction
        </Button>
        <Button type="button" variant="outline" onClick={clearCanvas} className="rounded-xl bg-white">
          Clear
        </Button>
      </div>
    </div>
  )
}

function PictureMatchActivity({
  title,
  prompt,
  correctWords,
  distractorWords,
  onComplete,
}: {
  title: string
  prompt: string
  correctWords: string[]
  distractorWords: string[]
  onComplete: () => void
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const choices = useMemo(() => {
    const correct = correctWords.slice(0, 4).map((word) => ({ word, correct: true }))
    const distractors = shuffleList([...distractorWords, ...PICTURE_DISTRACTORS]).slice(0, 4).map((word) => ({ word, correct: false }))
    return shuffleList([...correct, ...distractors])
  }, [correctWords, distractorWords])

  function choose(word: string, correct: boolean) {
    setSelected((current) => ({ ...current, [word]: correct }))
    if (correct) onComplete()
  }

  return (
    <ActivityCard title={title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-600">{prompt}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => speakText(prompt)} className="rounded-xl bg-white">
          <Volume2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Hear question
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {choices.map((choice) => (
          <button
            key={`${title}-${choice.word}`}
            type="button"
            onClick={() => choose(choice.word, choice.correct)}
            className={cn(
              'min-h-[92px] rounded-2xl border bg-white p-3 text-center shadow-sm transition',
              selected[choice.word] === true && 'border-emerald-300 bg-emerald-50',
              selected[choice.word] === false && 'border-red-300 bg-red-50',
            )}
          >
            <span className="block text-3xl font-black text-[#0F172A]">{PICTURE_SYMBOLS[choice.word.toLowerCase()] ?? choice.word.slice(0, 2)}</span>
            <span className="mt-1 block text-sm font-black text-slate-700">{choice.word}</span>
          </button>
        ))}
      </div>
    </ActivityCard>
  )
}

function SoundPopActivity({
  correctWords,
  distractorWords,
  onComplete,
}: {
  correctWords: string[]
  distractorWords: string[]
  onComplete: () => void
}) {
  const [popped, setPopped] = useState<Record<string, boolean>>({})
  const choices = useMemo(() => {
    const correct = correctWords.slice(0, 3).map((word) => ({ word, correct: true }))
    const distractors = shuffleList([...distractorWords, ...PICTURE_DISTRACTORS]).slice(0, 5).map((word) => ({ word, correct: false }))
    return shuffleList([...correct, ...distractors])
  }, [correctWords, distractorWords])
  const found = Object.values(popped).filter(Boolean).length
  const target = Math.max(1, choices.filter((choice) => choice.correct).length)

  return (
    <ActivityCard title="Pop the Sound">
      <p className="mb-3 text-sm font-bold text-slate-600">Pop every bubble that belongs with this sound.</p>
      <div className="grid grid-cols-4 gap-2">
        {choices.map((choice) => {
          const state = popped[choice.word]
          return (
            <button
              key={`pop-${choice.word}`}
              type="button"
              onClick={() => {
                setPopped((current) => ({ ...current, [choice.word]: choice.correct }))
                if (choice.correct) onComplete()
              }}
              className={cn(
                'aspect-square rounded-full border-4 border-[#38BDF8] bg-white text-sm font-black text-[#0F172A] shadow-sm transition hover:scale-105',
                state === true && 'scale-90 border-emerald-400 bg-emerald-100 opacity-70',
                state === false && 'border-red-300 bg-red-50',
              )}
            >
              {choice.word}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-sm font-black text-[#0F172A]">Stars found: {found} / {target}</p>
    </ActivityCard>
  )
}

function BlendingActivity({
  words,
  activity,
  onComplete,
}: {
  words: string[]
  activity: JollyInteractiveActivity
  onComplete: () => void
}) {
  const [activeWord, setActiveWord] = useState(words[0] ?? '')

  useEffect(() => {
    if (!words.includes(activeWord)) setActiveWord(words[0] ?? '')
  }, [activeWord, words])

  if (!words.length) return null

  return (
    <ActivityCard title="Blend It">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => { playWordAudio(activity, activeWord); onComplete() }} className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
          <Volume2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Hear Word
        </Button>
        <div className="flex flex-wrap gap-1.5">
          {splitSoundTiles(activeWord).map((tile, index) => (
            <span key={`${activeWord}-${index}`} className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#EFF6FF] px-3 text-xl font-black text-[#1D4ED8] shadow-sm">
              {tile}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.slice(0, 8).map((word) => (
          <button key={`blend-${word}`} type="button" onClick={() => setActiveWord(word)} className={cn('rounded-full px-4 py-2 text-sm font-black', activeWord === word ? 'bg-[#FBBF24] text-[#0F172A]' : 'bg-white text-slate-700')}>
            {word}
          </button>
        ))}
      </div>
    </ActivityCard>
  )
}

function SegmentingActivity({
  words,
  activity,
  onComplete,
}: {
  words: string[]
  activity: JollyInteractiveActivity
  onComplete: () => void
}) {
  const [activeWord, setActiveWord] = useState(words[0] ?? '')
  const [box, setBox] = useState<string[]>([])
  const tiles = useMemo(() => shuffleList(splitSoundTiles(activeWord)), [activeWord])
  const complete = box.join('') === activeWord && activeWord.length > 0

  useEffect(() => {
    setActiveWord(words[0] ?? '')
  }, [words])

  useEffect(() => {
    setBox([])
  }, [activeWord])

  useEffect(() => {
    if (complete) onComplete()
  }, [complete, onComplete])

  if (!words.length) return null

  return (
    <ActivityCard title="Segment It">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => playWordAudio(activity, activeWord)} className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
          <Volume2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Hear Word
        </Button>
        <select value={activeWord} onChange={(event) => setActiveWord(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
          {words.slice(0, 8).map((word) => <option key={`segment-option-${word}`} value={word}>{word}</option>)}
        </select>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF] p-3">
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#1D4ED8]">Build the word here</p>
        <div className="flex min-h-14 flex-wrap gap-2">
          {box.length ? box.map((tile, index) => (
            <button key={`box-${index}`} type="button" onClick={() => setBox((current) => current.filter((_, tileIndex) => tileIndex !== index))} className="rounded-xl bg-white px-4 py-2 text-xl font-black text-[#0F172A] shadow-sm">
              {tile}
            </button>
          )) : <span className="text-sm font-semibold text-slate-500">Tap or drag tiles into this box.</span>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tiles.map((tile, index) => (
          <button
            key={`scramble-${activeWord}-${tile}-${index}`}
            type="button"
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', tile)}
            onClick={() => setBox((current) => [...current, tile])}
            className="rounded-xl bg-white px-4 py-2 text-xl font-black text-[#1D4ED8] shadow-sm"
          >
            {tile}
          </button>
        ))}
        <button
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const tile = event.dataTransfer.getData('text/plain')
            if (tile) setBox((current) => [...current, tile])
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-600"
        >
          Drop here
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className={cn('text-sm font-black', complete ? 'text-emerald-700' : 'text-slate-500')}>
          {complete ? 'Nice segmenting!' : `Target: ${activeWord.length ? '_ '.repeat(splitSoundTiles(activeWord).length) : ''}`}
        </p>
        <Button type="button" variant="outline" onClick={() => setBox([])} className="rounded-xl bg-white">Try Again</Button>
      </div>
    </ActivityCard>
  )
}

function ActivityCertificate({
  earned,
  title,
  onEarn,
}: {
  earned: boolean
  title: string
  onEarn: () => void
}) {
  return (
    <div className={cn('rounded-3xl border p-5 text-center shadow-sm', earned ? 'border-amber-300 bg-[#FFFBEB]' : 'border-white/70 bg-white/70')}>
      <p className="text-xs font-black uppercase tracking-wide text-[#B45309]">Activity Certificate</p>
      <h4 className="mt-2 text-2xl font-black text-[#0F172A]">{earned ? 'Star earned!' : 'Finish an activity to earn a star'}</h4>
      <p className="mt-1 text-sm font-semibold text-slate-600">{title}</p>
      <div className="mx-auto mt-4 max-w-sm rounded-2xl border-4 border-[#FBBF24] bg-white p-4">
        <p className="text-xs font-black uppercase tracking-wide text-[#1D4ED8]">Phonics Club</p>
        <p className="mt-2 text-xl font-black text-[#0F172A]">Sound Activity Star</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">Awarded for completing interactive phonics practice.</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!earned && <Button type="button" onClick={onEarn} className="rounded-xl bg-[#FBBF24] text-[#0F172A] hover:bg-[#F59E0B]">Mark Star</Button>}
        <Button type="button" variant="outline" onClick={() => window.print()} className="rounded-xl bg-white">Print Certificate</Button>
      </div>
    </div>
  )
}

function PracticePanel({ title, body }: { title: string; body?: string }) {
  if (!body) return null
  return (
    <div className="rounded-3xl border border-white/70 bg-white/82 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#1D4ED8]">{title}</p>
      <p className="mt-2 text-lg font-bold leading-7 text-[#0F172A]">{body}</p>
    </div>
  )
}

function WordPanel({
  title,
  words,
  emptyText,
  subtle = false,
}: {
  title: string
  words: string[]
  emptyText: string
  subtle?: boolean
}) {
  return (
    <div className={cn('rounded-3xl border p-5 shadow-sm', subtle ? 'border-amber-200 bg-amber-50/80' : 'border-white/70 bg-white/82')}>
      <p className="text-xs font-black uppercase tracking-wide text-[#1D4ED8]">{title}</p>
      {words.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {words.map((word) => (
            <span key={`${title}-${word}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-lg font-black text-[#0F172A] shadow-sm">
              {word}
            </span>
          ))}
        </div>
      ) : emptyText ? (
        <p className="mt-2 text-sm font-semibold text-slate-500">{emptyText}</p>
      ) : null}
    </div>
  )
}

const SOUND_TILE_PATTERNS = ['th', 'oo', 'ai', 'oa', 'ie', 'ee', 'or', 'ng', 'ch', 'sh', 'qu', 'ou', 'oi', 'ue', 'er', 'ar', 'ck']

function splitSoundTiles(word: string) {
  const tiles: string[] = []
  let index = 0
  while (index < word.length) {
    const nextTwo = word.slice(index, index + 2).toLowerCase()
    if (SOUND_TILE_PATTERNS.includes(nextTwo)) {
      tiles.push(word.slice(index, index + 2))
      index += 2
    } else {
      tiles.push(word[index])
      index += 1
    }
  }
  return tiles
}

function TilePanel({ title, words }: { title: string; words: string[] }) {
  if (!words.length) return null

  return (
    <div className="rounded-3xl border border-white/70 bg-white/82 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#1D4ED8]">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {words.slice(0, 8).map((word) => (
          <div key={`${title}-${word}`} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
            <p className="text-xl font-black text-[#0F172A]">{word}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {splitSoundTiles(word).map((tile, index) => (
                <span key={`${word}-${index}`} className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-white px-2 text-base font-black text-[#1D4ED8] shadow-sm">
                  {tile}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MediaMissingState({ icon: Icon, title, light = false }: { icon: LucideIcon; title: string; light?: boolean }) {
  return (
    <div
      className={cn(
        'flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center',
        light ? 'border-slate-300 bg-[#F8FAFC] text-slate-600' : 'border-white/20 bg-white/5 text-white',
      )}
    >
      <Icon className={cn('mb-3 h-10 w-10', light ? 'text-[#1D4ED8]' : 'text-[#FBBF24]')} aria-hidden="true" />
      <p className="font-semibold">{title}</p>
    </div>
  )
}

function ResourcesSection({
  resources,
  pending,
  onOpenResource,
}: {
  resources: CourseResource[]
  pending: boolean
  onOpenResource: (resource: CourseResource) => void
}) {
  return (
    <section className="border-t border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
        <Download className="h-5 w-5 text-[#1D4ED8]" aria-hidden="true" />
        Resources
      </h3>
      <ul className="mt-4 grid gap-3">
        {resources.map((resource) => {
          const size = formatBytes(resource.file_size_bytes)
          return (
            <li key={resource.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[#0F172A]">{resource.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {[resource.resource_type, size, resource.is_downloadable ? 'Downloadable' : 'View only'].filter(Boolean).join(' / ')}
                </p>
                {resource.description && <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl border-slate-200 bg-white"
                disabled={pending || (!resource.resource_url && !resource.external_url && !resource.storage_path)}
                onClick={() => onOpenResource(resource)}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Open
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function LessonActions({
  activeDone,
  pending,
  activeIndex,
  totalLessons,
  nextLocked,
  onPrevious,
  onNext,
  onComplete,
  completeDisabled = false,
  completeDisabledLabel = 'Unavailable',
}: {
  activeDone: boolean
  pending: boolean
  activeIndex: number
  totalLessons: number
  nextLocked: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  completeDisabled?: boolean
  completeDisabledLabel?: string
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl border-slate-200 bg-white"
        disabled={activeIndex === 0}
        onClick={onPrevious}
      >
        <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Previous Lesson
      </Button>

      <Button
        type="button"
        className="rounded-xl bg-[#8B1E2D] hover:bg-[#8B1E2D]/90"
        disabled={pending || activeDone || completeDisabled}
        onClick={onComplete}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
        {activeDone ? 'Completed' : pending ? 'Saving...' : completeDisabled ? completeDisabledLabel : 'Mark Complete'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="rounded-xl border-slate-200 bg-white"
        disabled={activeIndex >= totalLessons - 1 || nextLocked}
        onClick={onNext}
      >
        Next Lesson
        <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

function LessonInfoPanel({
  lesson,
  moduleTitle,
  resources,
  quizzes,
  courseId,
  sourceUrl,
  previewMode,
  quizLocked,
  lockedQuizLessonCount,
  collapsed,
  onToggleCollapsed,
}: {
  lesson: CourseLesson
  moduleTitle: string
  resources: CourseResource[]
  quizzes: CourseQuiz[]
  courseId: string
  sourceUrl: string | null
  previewMode: boolean
  quizLocked: boolean
  lockedQuizLessonCount: number
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const details = [
    { label: 'Module', value: moduleTitle, icon: Layers3 },
    lesson.duration_minutes ? { label: 'Duration', value: `${lesson.duration_minutes} min`, icon: Clock } : null,
    { label: 'Type', value: formatLessonType(lesson.lesson_type), icon: BookOpenText },
    { label: 'Completion', value: formatLessonType(lesson.completion_mode ?? 'manual'), icon: ListChecks },
    { label: 'Required', value: lesson.is_compulsory === false ? 'Optional' : 'Required', icon: CheckCircle2 },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: LucideIcon }>

  if (collapsed) {
    return (
      <aside className="pc-course-info-panel flex min-h-[220px] flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-600 hover:text-[#1D4ED8]"
          aria-label="Expand lesson details"
          onClick={onToggleCollapsed}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex flex-1 items-center">
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold uppercase tracking-wide text-slate-500">
            Details
          </span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="pc-course-info-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Lesson details</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-slate-600 hover:text-[#1D4ED8]"
          aria-label="Collapse lesson details"
          onClick={onToggleCollapsed}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <ul className="mt-4 space-y-2.5">
        {details.map(({ label, value, icon: Icon }) => (
          <li key={label} className="flex gap-3 rounded-xl bg-[#F8FAFC] p-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">{label}</span>
              <span className="block text-sm font-semibold leading-5 text-[#0F172A]">{value}</span>
            </span>
          </li>
        ))}
      </ul>

      {(resources.length > 0 || quizzes.length > 0 || sourceUrl) && (
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
          {resources.length > 0 && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Download className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
              {resources.length} attached resource{resources.length === 1 ? '' : 's'}
            </p>
          )}
          {quizzes.length > 0 && (quizLocked ? (
            <Button type="button" variant="outline" disabled className="w-full justify-start rounded-xl border-slate-200 bg-white">
              <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
              {lockedQuizLessonCount} lesson{lockedQuizLessonCount === 1 ? '' : 's'} left
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-slate-200 bg-white">
              <Link href={quizHref(courseId, quizzes[0]?.id, previewMode)}>
                <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Open Quiz
              </Link>
            </Button>
          ))}
          {sourceUrl && (
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-slate-200 bg-white">
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Open Source
              </a>
            </Button>
          )}
        </div>
      )}
    </aside>
  )
}
