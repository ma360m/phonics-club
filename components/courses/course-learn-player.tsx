'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Download,
  FileText,
  Lock,
  Maximize2,
  MessageSquare,
  NotebookPen,
  PanelTop,
  PlayCircle,
  Search,
  Sparkles,
  ZoomIn,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getSignedCourseResourceAction,
  markLessonCompleteAction,
  recordLearningHeartbeatAction,
  startLearningSessionAction,
} from '@/actions/lms'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Course, CourseLesson, CourseQuiz, CourseResource, LessonProgress, LessonReadingType } from '@/types/database'
import type { CourseModuleWithLessons } from '@/lib/lms'

interface Props {
  course: Course
  modules: CourseModuleWithLessons[]
  progressItems: LessonProgress[]
  resources: CourseResource[]
  quizzes: CourseQuiz[]
  initialProgress: number
}

function embedUrl(url: string | null) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{6,})/)
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url
}

export function CourseLearnPlayer({
  course,
  modules,
  progressItems,
  resources,
  quizzes,
  initialProgress,
}: Props) {
  const lessons = useMemo(
    () => modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))),
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
  const [completionBurst, setCompletionBurst] = useState(false)
  const [pending, startTransition] = useTransition()
  const lastActivityRef = useRef(Date.now())
  const sessionIdRef = useRef<string | null>(null)

  const activeIndex = Math.max(lessons.findIndex((lesson) => lesson.id === activeLessonId), 0)
  const activeLesson = lessons[activeIndex]
  const activeResources = resources.filter((resource) => !resource.lesson_id || resource.lesson_id === activeLesson?.id)

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
    if (!activeLesson?.id || activeLesson.id.startsWith('curriculum-')) return

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
  }, [activeLesson?.id, course.id])

  function isLocked(index: number) {
    if (index === 0) return false
    const previousLesson = lessons[index - 1]
    return previousLesson ? !completed.has(previousLesson.id) : false
  }

  function chooseLesson(lessonId: string, index: number) {
    if (isLocked(index)) {
      toast.info('Complete the previous lesson first')
      return
    }
    setActiveLessonId(lessonId)
  }

  function markComplete() {
    if (!activeLesson) return
    startTransition(async () => {
      const result = await markLessonCompleteAction(course.id, activeLesson.id)
      if (result.success && result.data) {
        const nextCompleted = new Set(completed)
        nextCompleted.add(activeLesson.id)
        setCompleted(nextCompleted)
        setProgress(result.data.progress)
        setCompletionBurst(true)
        window.setTimeout(() => setCompletionBurst(false), 2400)
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

  const lessonNav = (
    <div className="space-y-4">
      {modules.map((module) => (
        <section key={module.id}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{module.title}</h2>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const index = lessons.findIndex((item) => item.id === lesson.id)
              const locked = isLocked(index)
              const active = activeLessonId === lesson.id
              const done = completed.has(lesson.id)
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => chooseLesson(lesson.id, index)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active ? 'bg-[#1D4ED8] text-white' : locked ? 'text-muted-foreground opacity-60' : 'hover:bg-muted'
                    }`}
                  >
                    {locked ? (
                      <Lock className="h-4 w-4 shrink-0" />
                    ) : done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="line-clamp-2">{lesson.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )

  if (!activeLesson) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <BookOpenFallback />
        <h1 className="text-2xl font-bold">No lessons are available yet</h1>
        <p className="mt-2 text-muted-foreground">Please check back after the instructor publishes lessons.</p>
      </div>
    )
  }

  const video = embedUrl(activeLesson.video_url)
  const lessonProgressPercent = lessons.length ? Math.round((completed.size / lessons.length) * 100) : progress
  const readingMode: LessonReadingType = activeLesson.reading_type ?? (
    activeLesson.lesson_type === 'pdf' ? 'pdf_viewer' :
    activeLesson.lesson_type === 'flipbook' ? 'flipbook' :
    activeLesson.lesson_type === 'presentation' ? 'powerpoint_slides' :
    activeLesson.lesson_type === 'interactive' ? 'interactive_presentation' :
    'rich_article'
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="hidden rounded-2xl border bg-card p-4 shadow-sm lg:block">
        {lessonNav}
      </aside>

      <section className="space-y-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1D4ED8]">{course.title}</p>
              <h1 className="mt-1 text-2xl font-bold">{activeLesson.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{activeLesson.moduleTitle}</p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl lg:hidden">Lessons</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Course lessons</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{lessonNav}</div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
          {completionBurst && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
              <div className="mt-4 rounded-full border bg-white px-4 py-2 text-sm font-bold text-[#D30000] shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-3">
                <Sparkles className="mr-2 inline h-4 w-4 text-[#FBBF24]" />
                Lesson complete. Progress updated.
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-5">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1 sm:grid-cols-4 xl:grid-cols-7">
              <TabsTrigger value="overview"><ClipboardCheck className="mr-2 h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="video"><PlayCircle className="mr-2 h-4 w-4" /> Video</TabsTrigger>
              <TabsTrigger value="reading"><BookOpenText className="mr-2 h-4 w-4" /> Reading</TabsTrigger>
              <TabsTrigger value="practice"><PanelTop className="mr-2 h-4 w-4" /> Practice</TabsTrigger>
              <TabsTrigger value="downloads"><Download className="mr-2 h-4 w-4" /> Downloads</TabsTrigger>
              <TabsTrigger value="notes"><NotebookPen className="mr-2 h-4 w-4" /> Notes</TabsTrigger>
              <TabsTrigger value="discussion"><MessageSquare className="mr-2 h-4 w-4" /> Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                <div>
                  <h2 className="text-xl font-bold">Lesson overview</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {activeLesson.description ?? activeLesson.content ?? 'Follow the lesson, complete the activity, then mark it complete to update your course progress.'}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Reading type', value: readingMode.replace(/_/g, ' ') },
                      { label: 'Completion', value: activeLesson.completion_mode?.replace(/_/g, ' ') ?? 'manual' },
                      { label: 'Required', value: activeLesson.is_compulsory === false ? 'optional' : 'compulsory' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-[#F8FAFC] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-4 text-center">
                  <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-[#DBEAFE]">
                    <div
                      className="absolute inset-[-10px] rounded-full"
                      style={{
                        background: `conic-gradient(#1D4ED8 ${lessonProgressPercent * 3.6}deg, transparent 0deg)`,
                        mask: 'radial-gradient(circle, transparent 55%, black 56%)',
                      }}
                    />
                    <div>
                      <p className="text-3xl font-bold text-[#1D4ED8]">{lessonProgressPercent}%</p>
                      <p className="text-xs text-muted-foreground">lessons</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {completed.size}/{lessons.length} lessons completed
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">
                {video ? (
                  <iframe
                    className="h-full w-full"
                    src={video}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
                    <PlayCircle className="mb-3 h-12 w-12 text-[#FBBF24]" />
                    <p className="text-lg font-semibold">{activeLesson.title}</p>
                    <p className="mt-2 max-w-md text-sm text-white/70">
                      Video content can be attached from the admin course builder using an external URL or protected storage.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reading" className="mt-0">
              <ReadingMaterial lesson={activeLesson} readingMode={readingMode} />
            </TabsContent>

            <TabsContent value="practice" className="mt-0">
              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <h2 className="text-xl font-bold">Practice activity</h2>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {activeLesson.practice_prompt ?? 'Add a classroom activity, reflection task, H5P-style interaction or worksheet prompt from the admin course builder.'}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {['Try it', 'Reflect', 'Apply in class'].map((step, index) => (
                    <div key={step} className="rounded-xl border bg-white p-4 text-sm">
                      <p className="mb-2 text-xs font-bold text-[#D30000]">Step {index + 1}</p>
                      <p className="font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="downloads" className="mt-0">
              {activeResources.length ? (
                <ul className="space-y-2">
                  {activeResources.map((resource) => (
                    <li key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        {resource.description && <p className="text-xs text-muted-foreground">{resource.description}</p>}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={pending || (!resource.resource_url && !resource.external_url && !resource.storage_path)}
                        onClick={() => openResource(resource)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No downloads are attached to this lesson yet.</p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <textarea
                className="min-h-40 w-full rounded-xl border bg-background p-3 text-sm"
                placeholder="Write private lesson notes here. Database-backed notes are ready in the LMS schema and can be connected to autosave when you want that workflow live."
              />
            </TabsContent>

            <TabsContent value="discussion" className="mt-0">
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                {activeLesson.discussion_prompt ?? 'Discussion threads are available in the LMS schema. Once moderation is enabled, students can post lesson questions and classroom reflections here.'}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={activeIndex === 0}
              onClick={() => chooseLesson(lessons[activeIndex - 1].id, activeIndex - 1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90"
              disabled={pending || completed.has(activeLesson.id)}
              onClick={markComplete}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {completed.has(activeLesson.id) ? 'Completed' : 'Mark as Complete'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={activeIndex >= lessons.length - 1 || isLocked(activeIndex + 1)}
              onClick={() => chooseLesson(lessons[activeIndex + 1].id, activeIndex + 1)}
            >
              Next Lesson
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-[#F8FAFC] p-5 shadow-sm">
          <h2 className="text-xl font-bold">Quiz</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete the quiz after studying the lesson sequence. Scores are calculated on the server.
          </p>
          {quizzes.length ? (
            <Button asChild className="mt-4 rounded-xl bg-[#1D4ED8]">
              <Link href={`/course/${course.id}/quiz`}>
                Launch Quiz
              </Link>
            </Button>
          ) : (
            <Button type="button" className="mt-4 rounded-xl" disabled>
              Quiz Pending
            </Button>
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t bg-white p-3 shadow-2xl lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={activeIndex === 0}
          onClick={() => chooseLesson(lessons[activeIndex - 1].id, activeIndex - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-[#D30000]"
          disabled={pending || completed.has(activeLesson.id)}
          onClick={markComplete}
        >
          Complete
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={activeIndex >= lessons.length - 1 || isLocked(activeIndex + 1)}
          onClick={() => chooseLesson(lessons[activeIndex + 1].id, activeIndex + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function BookOpenFallback() {
  return <FileText className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
}

function ReadingMaterial({
  lesson,
  readingMode,
}: {
  lesson: CourseLesson
  readingMode: LessonReadingType
}) {
  const content =
    lesson.article_content ||
    lesson.rich_content ||
    lesson.content ||
    'Add the licensed official lesson reading content in the admin course builder. The student view will render the content directly without summarising it.'
  const sourceUrl = lesson.reading_external_url || lesson.material_url

  const toolItems = [
    lesson.search_enabled !== false && { label: 'Search', icon: Search },
    lesson.zoom_enabled !== false && { label: 'Zoom', icon: ZoomIn },
    lesson.fullscreen_enabled !== false && { label: 'Fullscreen', icon: Maximize2 },
    lesson.bookmark_enabled !== false && { label: 'Bookmarks', icon: NotebookPen },
  ].filter(Boolean) as Array<{ label: string; icon: typeof Search }>

  if (readingMode === 'pdf_viewer') {
    return (
      <div className="space-y-4">
        <ReadingToolbar modeLabel="PDF viewer" items={toolItems} />
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="min-h-[420px] rounded-2xl border bg-[#F8FAFC] p-5">
            {sourceUrl ? (
              <iframe className="h-[420px] w-full rounded-xl border bg-white" src={sourceUrl} title={`${lesson.title} PDF`} />
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center rounded-xl border border-dashed bg-white p-6 text-center">
                <FileText className="mb-3 h-10 w-10 text-[#1D4ED8]" />
                <h3 className="font-bold">PDF material pending</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Upload a protected PDF or add a PDF URL in the lesson reading fields.
                </p>
              </div>
            )}
          </div>
          <ReadingSidePanel lesson={lesson} />
        </div>
      </div>
    )
  }

  if (readingMode === 'flipbook') {
    return (
      <div className="space-y-4">
        <ReadingToolbar modeLabel="Flipbook" items={toolItems} />
        <div className="rounded-2xl border bg-[#EAF4FF] p-5">
          <div className="grid min-h-[360px] gap-4 md:grid-cols-2">
            {[0, 1].map((page) => (
              <article key={page} className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#D30000]">Page {page + 1}</p>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>{content}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full w-2/5 rounded-full bg-[#1D4ED8]" />
          </div>
        </div>
      </div>
    )
  }

  if (readingMode === 'powerpoint_slides' || readingMode === 'interactive_presentation') {
    return (
      <div className="space-y-4">
        <ReadingToolbar
          modeLabel={readingMode === 'powerpoint_slides' ? 'PowerPoint slides' : 'Interactive presentation'}
          items={toolItems}
        />
        <div className="rounded-2xl border bg-[#0F172A] p-5 text-white">
          <div className="aspect-video rounded-xl border border-white/10 bg-white p-8 text-[#111827] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#D30000]">{lesson.title}</p>
            <h3 className="mt-4 text-3xl font-bold">Slide 1</h3>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{content}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
            <span>Slide deck controls are ready for uploaded PPT/PPTX or interactive presentation data.</span>
            <Button type="button" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Maximize2 className="mr-2 h-4 w-4" />
              Fullscreen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReadingToolbar modeLabel="Rich article" items={toolItems} />
      <article className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">{lesson.title}</p>
        <div className="prose max-w-none leading-8 text-muted-foreground">
          {content.split('\n').filter(Boolean).map((paragraph, index) => (
            <p key={`${lesson.id}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}

function ReadingToolbar({
  modeLabel,
  items,
}: {
  modeLabel: string
  items: Array<{ label: string; icon: typeof Search }>
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] p-3">
      <p className="text-sm font-bold text-[#1D4ED8]">{modeLabel}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ label, icon: Icon }) => (
          <Button key={label} type="button" size="sm" variant="outline" className="rounded-xl">
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ReadingSidePanel({ lesson }: { lesson: CourseLesson }) {
  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-bold">Reading tools</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Bookmarks: {lesson.bookmark_enabled === false ? 'off' : 'on'}</li>
          <li>Highlights: {lesson.highlight_enabled === false ? 'off' : 'on'}</li>
          <li>Dark mode: {lesson.dark_mode_enabled === false ? 'off' : 'on'}</li>
          <li>Download: {lesson.download_enabled === false ? 'off' : 'on'}</li>
        </ul>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-bold">Progress</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Completion can be manual or based on a configured content threshold.
        </p>
      </div>
    </aside>
  )
}
