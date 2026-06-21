'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import type { Course } from '@/types/database'

interface Props {
  course: Course
  initialProgress: number
}

export function CourseLearnPlayer({ course, initialProgress }: Props) {
  const [progress, setProgress] = useState(initialProgress)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [activeLesson, setActiveLesson] = useState<{ module: number; lesson: number } | null>(
    course.curriculum?.[0]?.lessons?.[0] ? { module: 0, lesson: 0 } : null
  )

  const totalLessons =
    course.curriculum?.reduce((n, m) => n + m.lessons.length, 0) ?? 0

  function markComplete(moduleIdx: number, lessonIdx: number) {
    const key = `${moduleIdx}-${lessonIdx}`
    const next = new Set(completedLessons)
    next.add(key)
    setCompletedLessons(next)
    const pct = totalLessons ? Math.round((next.size / totalLessons) * 100) : 0
    setProgress(pct)
    toast.success(pct >= 100 ? 'Course completed! Certificate available.' : 'Lesson marked complete')
  }

  const currentLesson =
    activeLesson && course.curriculum?.[activeLesson.module]?.lessons[activeLesson.lesson]

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-3 mt-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>

        <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-white">
          {currentLesson ? (
            <div className="text-center p-8">
              <p className="text-lg font-semibold mb-2">{currentLesson.title}</p>
              <p className="text-white/70 text-sm">
                Video player — upload videos via Admin → Courses. Connect Supabase Storage bucket <code className="bg-white/10 px-1 rounded">course-videos</code>.
              </p>
              {currentLesson.duration && (
                <p className="text-white/50 text-xs mt-2">Duration: {currentLesson.duration}</p>
              )}
            </div>
          ) : (
            <p className="text-white/70">Select a lesson to begin</p>
          )}
        </div>

        {currentLesson && activeLesson && (
          <Button
            onClick={() => markComplete(activeLesson.module, activeLesson.lesson)}
            className="rounded-xl bg-[#1D4ED8]"
            disabled={completedLessons.has(`${activeLesson.module}-${activeLesson.lesson}`)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Lesson Complete
          </Button>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-4">Curriculum</h2>
        <Accordion type="single" collapsible defaultValue="module-0">
          {course.curriculum?.map((mod, mi) => (
            <AccordionItem key={mi} value={`module-${mi}`} className="border rounded-xl mb-2 px-3">
              <AccordionTrigger className="text-sm font-medium">{mod.title}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1">
                  {mod.lessons.map((lesson, li) => {
                    const key = `${mi}-${li}`
                    const done = completedLessons.has(key)
                    const active = activeLesson?.module === mi && activeLesson?.lesson === li
                    return (
                      <li key={li}>
                        <button
                          type="button"
                          onClick={() => setActiveLesson({ module: mi, lesson: li })}
                          className={`w-full text-left text-sm py-2 px-2 rounded-lg flex items-center gap-2 ${
                            active ? 'bg-[#1D4ED8]/10 text-[#1D4ED8]' : 'hover:bg-muted'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
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
