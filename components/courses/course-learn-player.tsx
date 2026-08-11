'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
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
  Video,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getSignedCourseResourceAction,
  markLessonCompleteAction,
  recordLearningHeartbeatAction,
  startLearningSessionAction,
} from '@/actions/lms'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
    }, 45_000)

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
        <div className="space-y-2 overflow-y-auto pb-4">
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

      <div className="h-[calc(100%-132px)] overflow-y-auto px-3 py-3">
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
