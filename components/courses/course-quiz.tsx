'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, CircleAlert, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { submitQuizAttemptAction } from '@/actions/lms'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { CourseQuiz, QuizAttempt, QuizQuestion } from '@/types/database'

type PublicQuizQuestion = Omit<QuizQuestion, 'correct_option' | 'correct_options' | 'acceptable_answers' | 'matching_pairs'>
type QuizAnswer = number | number[] | string

function displayOptions(question: PublicQuizQuestion) {
  if (question.question_type === 'true_false' && !question.options.length) return ['True', 'False']
  return question.options
}

function isAnswered(answer: QuizAnswer | undefined) {
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'string') return answer.trim().length > 0
  return typeof answer === 'number'
}

export function CourseQuiz({
  courseId,
  quiz,
  questions,
  attempts,
}: {
  courseId: string
  quiz: CourseQuiz
  questions: PublicQuizQuestion[]
  attempts: QuizAttempt[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const latestAttempt = attempts[0]
  const attemptsLeft = Math.max(Number(quiz.max_attempts) - attempts.length, 0)
  const activeQuestion = questions[activeIndex]
  const activeOptions = displayOptions(activeQuestion)
  const answeredCount = useMemo(
    () => questions.filter((question) => isAnswered(answers[question.id])).length,
    [answers, questions],
  )
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  function toggleMultiple(questionId: string, optionIndex: number) {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] as number[] : []
      const next = selected.includes(optionIndex)
        ? selected.filter((item) => item !== optionIndex)
        : [...selected, optionIndex]
      return { ...current, [questionId]: next }
    })
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CircleAlert className="mx-auto mb-3 h-10 w-10 text-[#FBBF24]" />
        <h2 className="text-xl font-bold">Quiz content is pending</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The quiz schema is ready, but this course does not have questions yet.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1D4ED8]">Question {activeIndex + 1} of {questions.length}</p>
            <h1 className="mt-1 text-2xl font-bold">{quiz.title}</h1>
          </div>
          <div className="min-w-40">
            <Progress value={progress} className="h-2" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{progress}% answered</p>
          </div>
        </div>

        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold uppercase text-[#1D4ED8]">
              {(activeQuestion.question_type ?? 'mcq').replace(/_/g, ' ')}
            </span>
            {activeQuestion.points && <span className="text-xs text-muted-foreground">{activeQuestion.points} point(s)</span>}
          </div>
          <h2 className="text-xl font-semibold">{activeQuestion.question}</h2>
          {activeQuestion.image_url && (
            <img src={activeQuestion.image_url} alt="Question prompt" className="mt-4 max-h-72 w-full rounded-xl object-contain" />
          )}
          {activeQuestion.audio_url && (
            <audio controls src={activeQuestion.audio_url} className="mt-4 w-full">
              <track kind="captions" />
            </audio>
          )}
          <div className="mt-5 space-y-3">
            {activeQuestion.question_type === 'fill_blank' ? (
              <input
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
                value={typeof answers[activeQuestion.id] === 'string' ? answers[activeQuestion.id] as string : ''}
                placeholder="Type your answer"
                onChange={(event) => setAnswers((current) => ({ ...current, [activeQuestion.id]: event.target.value }))}
              />
            ) : activeOptions.length ? (
              activeOptions.map((option, optionIndex) => {
                const selected = answers[activeQuestion.id]
                const isMultiple = activeQuestion.question_type === 'multiple_select'
                const checked = isMultiple
                  ? Array.isArray(selected) && selected.includes(optionIndex)
                  : selected === optionIndex
                return (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-[#1D4ED8]"
                  >
                    <input
                      type={isMultiple ? 'checkbox' : 'radio'}
                      name={activeQuestion.id}
                      checked={checked}
                      onChange={() => {
                        if (isMultiple) toggleMultiple(activeQuestion.id, optionIndex)
                        else setAnswers((current) => ({ ...current, [activeQuestion.id]: optionIndex }))
                      }}
                    />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                )
              })
            ) : (
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                This question type is configured, but answer options have not been published yet.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
          >
            Previous
          </Button>
          {activeIndex < questions.length - 1 ? (
            <Button
              type="button"
              className="rounded-xl bg-[#1D4ED8]"
              onClick={() => setActiveIndex((index) => Math.min(index + 1, questions.length - 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90"
              disabled={pending || answeredCount < questions.length || attemptsLeft <= 0}
              onClick={() => {
                if (!window.confirm('Submit this quiz attempt?')) return
                startTransition(async () => {
                  const response = await submitQuizAttemptAction(courseId, quiz.id, answers)
                  if (response.success && response.data) {
                    setResult(response.data)
                    toast.success(response.data.passed ? 'Quiz passed' : 'Quiz submitted')
                  } else {
                    toast.error(response.error ?? 'Quiz submission failed')
                  }
                })
              }}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-bold">Quiz rules</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Passing score: {quiz.passing_score}%</li>
            <li>Attempts allowed: {quiz.max_attempts}</li>
            <li>Attempts left: {attemptsLeft}</li>
            {quiz.timer_minutes && <li>Timer: {quiz.timer_minutes} minutes</li>}
            {quiz.randomize_questions && <li>Questions may be randomized</li>}
            {quiz.show_explanations && <li>Explanations are shown after submission</li>}
          </ul>
        </div>
        {(result || latestAttempt) && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {result?.passed || latestAttempt?.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <RotateCcw className="h-5 w-5 text-[#D30000]" />
              )}
              <h2 className="font-bold">Result summary</h2>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#1D4ED8]">
              {result?.score ?? latestAttempt?.score}%
            </p>
            {result && (
              <p className="mt-1 text-sm text-muted-foreground">
                {result.correct} of {result.total} correct
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
