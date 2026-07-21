'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { submitQuizAttemptAction } from '@/actions/lms'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
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

function answerLabel(question: PublicQuizQuestion, answer: QuizAnswer | undefined) {
  if (!isAnswered(answer)) return 'Not answered'
  const options = displayOptions(question)
  if (Array.isArray(answer)) return answer.map((index) => options[index] ?? `Option ${index + 1}`).join(', ')
  if (typeof answer === 'number') return options[answer] ?? `Option ${answer + 1}`
  return answer
}

export function CourseQuiz({
  courseId,
  courseTitle,
  quiz,
  questions,
  attempts,
  previewMode = false,
}: {
  courseId: string
  courseTitle?: string
  quiz: CourseQuiz
  questions: PublicQuizQuestion[]
  attempts: QuizAttempt[]
  previewMode?: boolean
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [usedAttemptLocally, setUsedAttemptLocally] = useState(false)
  const [pending, startTransition] = useTransition()
  const latestAttempt = attempts[0]
  const attemptsUsed = attempts.length + (usedAttemptLocally ? 1 : 0)
  const attemptsLeft = Math.max(Number(quiz.max_attempts) - attemptsUsed, 0)
  const activeQuestion = questions[activeIndex]
  const activeOptions = activeQuestion ? displayOptions(activeQuestion) : []
  const answeredCount = useMemo(
    () => questions.filter((question) => isAnswered(answers[question.id])).length,
    [answers, questions],
  )
  const questionProgress = questions.length ? Math.round(((activeIndex + 1) / questions.length) * 100) : 0
  const answeredProgress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0
  const finalResult = result ?? (latestAttempt ? { score: latestAttempt.score, passed: latestAttempt.passed, correct: 0, total: questions.length } : null)
  const learningHref = previewMode ? `/course/${courseId}/learn?preview=admin` : `/course/${courseId}/learn`

  function toggleMultiple(questionId: string, optionIndex: number) {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] as number[] : []
      const next = selected.includes(optionIndex)
        ? selected.filter((item) => item !== optionIndex)
        : [...selected, optionIndex]
      return { ...current, [questionId]: next }
    })
  }

  function retake() {
    setAnswers({})
    setResult(null)
    setActiveIndex(0)
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CircleAlert className="mx-auto mb-3 h-10 w-10 text-[#FBBF24]" />
        <h2 className="text-xl font-bold text-[#0F172A]">Quiz content is pending</h2>
        <p className="mt-2 text-sm text-slate-500">
          This quiz exists, but questions have not been published yet.
        </p>
      </div>
    )
  }

  if (finalResult && (result || attemptsLeft <= 0)) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl',
            finalResult.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-[#FFF1F2] text-[#8B1E2D]',
          )}>
            {finalResult.passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Result summary</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#0F172A]">
            {finalResult.passed ? 'You passed the quiz' : 'Quiz submitted'}
          </h1>
          <p className="mt-3 text-slate-600">{quiz.title}</p>
          <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
            <ResultCard label="Score" value={`${finalResult.score}%`} />
            {result ? <ResultCard label="Correct" value={`${finalResult.correct}/${finalResult.total}`} /> : <ResultCard label="Attempts" value={`${attemptsUsed}/${quiz.max_attempts}`} />}
            <ResultCard label="Passing" value={`${quiz.passing_score}%`} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {attemptsLeft > 0 && (
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={retake}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Quiz
              </Button>
            )}
            <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              <a href={learningHref}>Back to Learning</a>
            </Button>
          </div>
        </section>

        {result && quiz.allow_review && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#0F172A]">Review your answers</h2>
            <p className="mt-1 text-sm text-slate-500">
              Correct answers are kept server-side. This review shows your submitted responses and the server-calculated score.
            </p>
            <ol className="mt-4 space-y-3">
              {questions.map((question, index) => (
                <li key={question.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Question {index + 1}</p>
                  <p className="mt-2 font-semibold text-[#0F172A]">{question.question}</p>
                  <p className="mt-2 text-sm text-slate-600">Your answer: {answerLabel(question, answers[question.id])}</p>
                  {quiz.show_explanations && question.explanation && (
                    <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600">{question.explanation}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    )
  }

  const selected = activeQuestion ? answers[activeQuestion.id] : undefined
  const isMultiple = activeQuestion.question_type === 'multiple_select'
  const isTextAnswer = ['fill_blank', 'short_answer', 'long_answer'].includes(activeQuestion.question_type ?? '')

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Quiz</p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-[#0F172A]">{quiz.title}</h1>
            {courseTitle && <p className="mt-2 text-sm text-slate-500">{courseTitle}</p>}
            {quiz.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{quiz.description}</p>}
          </div>
          <div className="min-w-[220px] rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Question progress</span>
              <span>{activeIndex + 1}/{questions.length}</span>
            </div>
            <Progress value={questionProgress} className="h-2" />
            <p className="mt-2 text-xs text-slate-500">{answeredProgress}% answered / {attemptsLeft} attempts left</p>
            {previewMode && <p className="mt-2 text-xs font-semibold text-[#1D4ED8]">Preview mode. Submissions are disabled.</p>}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold uppercase text-[#1D4ED8]">
            {(activeQuestion.question_type ?? 'mcq').replace(/_/g, ' ')}
          </span>
          {activeQuestion.points && <span className="text-xs text-slate-500">{activeQuestion.points} point(s)</span>}
        </div>
        <h2 className="text-xl font-semibold leading-8 text-[#0F172A]">{activeQuestion.question}</h2>
        {activeQuestion.image_url && (
          <img src={activeQuestion.image_url} alt="Question prompt" className="mt-4 max-h-72 w-full rounded-xl object-contain" />
        )}
        {activeQuestion.audio_url && (
          <audio controls src={activeQuestion.audio_url} className="mt-4 w-full">
            <track kind="captions" />
          </audio>
        )}

        <div className="mt-6 space-y-3">
          {isTextAnswer ? (
            activeQuestion.question_type === 'long_answer' ? (
              <textarea
                className="min-h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                value={typeof selected === 'string' ? selected : ''}
                placeholder="Write your answer"
                onChange={(event) => setAnswers((current) => ({ ...current, [activeQuestion.id]: event.target.value }))}
              />
            ) : (
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                value={typeof selected === 'string' ? selected : ''}
                placeholder="Type your answer"
                onChange={(event) => setAnswers((current) => ({ ...current, [activeQuestion.id]: event.target.value }))}
              />
            )
          ) : activeOptions.length ? (
            activeOptions.map((option, optionIndex) => {
              const checked = isMultiple
                ? Array.isArray(selected) && selected.includes(optionIndex)
                : selected === optionIndex
              return (
                <label
                  key={`${activeQuestion.id}-${optionIndex}`}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                    checked
                      ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#0F172A] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-[#BFDBFE] hover:bg-[#F8FAFC]',
                  )}
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
                  {checked && <CheckCircle2 className="ml-auto h-4 w-4 text-[#1D4ED8]" />}
                </label>
              )
            })
          ) : (
            <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm text-slate-500">
              This question type is configured, but answer options have not been published yet.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-200 bg-white"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {activeIndex < questions.length - 1 ? (
            <Button
              type="button"
              className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90"
              onClick={() => setActiveIndex((index) => Math.min(index + 1, questions.length - 1))}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-xl bg-[#8B1E2D] hover:bg-[#8B1E2D]/90"
              disabled={previewMode || pending || answeredCount < questions.length || attemptsLeft <= 0}
              onClick={() => {
                if (!window.confirm('Submit this quiz attempt? You cannot edit this attempt after submission.')) return
                startTransition(async () => {
                  const response = await submitQuizAttemptAction(courseId, quiz.id, answers)
                  if (response.success && response.data) {
                    setResult(response.data)
                    setUsedAttemptLocally(true)
                    toast.success(response.data.passed ? 'Quiz passed' : 'Quiz submitted')
                  } else {
                    toast.error(response.error ?? 'Quiz submission failed')
                  }
                })
              }}
            >
              {previewMode ? 'Preview Only' : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#0F172A]">{value}</p>
    </div>
  )
}
