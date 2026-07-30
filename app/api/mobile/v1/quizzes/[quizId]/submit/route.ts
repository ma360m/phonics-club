import { evaluateCourseCompletion, getCourseById, isEnrollmentActive } from '@/lib/lms'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileQuizSubmitSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'
import type { Course, QuizQuestion } from '@/types/database'

type QuizAnswer = number | number[] | string

function normalizeNumberArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item))
    .sort((a, b) => a - b)
}

function quizAnswerIsCorrect(question: QuizQuestion, answer: QuizAnswer | undefined) {
  const questionType = question.question_type ?? 'mcq'

  if (questionType === 'multiple_select') {
    const expected = normalizeNumberArray(question.correct_options?.length ? question.correct_options : [question.correct_option])
    const submitted = normalizeNumberArray(answer)
    return expected.length > 0 && expected.length === submitted.length && expected.every((item, index) => item === submitted[index])
  }

  if (questionType === 'fill_blank' || questionType === 'short_answer' || questionType === 'long_answer') {
    if (typeof answer !== 'string') return false
    const submitted = answer.trim().toLowerCase()
    const acceptable = Array.isArray(question.acceptable_answers) ? question.acceptable_answers : []
    return acceptable.map((item) => String(item).trim().toLowerCase()).includes(submitted)
  }

  return typeof answer === 'number' && answer === question.correct_option
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { quizId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'quiz-submit', { identifier: context.user.id, limit: 12, windowMs: 60_000 })

    const parsed = mobileQuizSubmitSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid quiz submission.', 400)
    }

    const [{ data: quiz }, { data: questions }, { count: attempts }] = await Promise.all([
      context.supabase.from('course_quizzes').select('*').eq('id', quizId).eq('published', true).maybeSingle(),
      context.supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('sort_order', { ascending: true }),
      context.supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('user_id', context.user.id),
    ])

    if (!quiz) throw new MobileApiError('QUIZ_NOT_FOUND', 'Quiz could not be found.', 404)
    const enrollmentResult = await context.supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', context.user.id)
      .eq('course_id', quiz.course_id)
      .maybeSingle()

    if (!isEnrollmentActive(enrollmentResult.data as never)) {
      throw new MobileApiError('QUIZ_FORBIDDEN', 'You must be actively enrolled to submit this quiz.', 403)
    }

    if ((attempts ?? 0) >= Number(quiz.max_attempts ?? 3)) {
      throw new MobileApiError('QUIZ_ATTEMPTS_EXHAUSTED', 'You have reached the retry limit for this quiz.', 409)
    }

    if (quiz.timer_minutes && parsed.data.clientStartedAt) {
      const startedAt = new Date(parsed.data.clientStartedAt).getTime()
      const maxDurationMs = (Number(quiz.timer_minutes) + 2) * 60_000
      if (Number.isFinite(startedAt) && Date.now() - startedAt > maxDurationMs) {
        throw new MobileApiError('QUIZ_TIME_EXPIRED', 'This quiz attempt has expired.', 409)
      }
    }

    const quizQuestions = ((questions ?? []) as QuizQuestion[])
    if (!quizQuestions.length) throw new MobileApiError('QUIZ_EMPTY', 'This quiz does not have questions yet.', 409)

    const validQuestionIds = new Set(quizQuestions.map((question) => question.id))
    const submittedIds = Object.keys(parsed.data.answers)
    const unknownId = submittedIds.find((id) => !validQuestionIds.has(id))
    if (unknownId) {
      throw new MobileApiError('QUIZ_INVALID_QUESTION', 'Quiz submission contains an invalid question.', 400)
    }

    const correct = quizQuestions.reduce((total, question) => {
      return total + (quizAnswerIsCorrect(question, parsed.data.answers[question.id]) ? 1 : 0)
    }, 0)
    const earnedPoints = quizQuestions.reduce((total, question) => {
      const points = Math.max(Number(question.points ?? 1), 1)
      return total + (quizAnswerIsCorrect(question, parsed.data.answers[question.id]) ? points : 0)
    }, 0)
    const availablePoints = quizQuestions.reduce((total, question) => total + Math.max(Number(question.points ?? 1), 1), 0)
    const score = Math.round((earnedPoints / Math.max(availablePoints, 1)) * 100)
    const passed = score >= Number(quiz.passing_score ?? 70)

    const { data: attempt, error } = await context.supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        course_id: quiz.course_id,
        user_id: context.user.id,
        score,
        passed,
        answers: parsed.data.answers,
        attempt_number: (attempts ?? 0) + 1,
        client_attempt_id: parsed.data.attemptId ?? null,
      } as never)
      .select('id, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new MobileApiError('QUIZ_DUPLICATE_ATTEMPT', 'This quiz attempt was already submitted.', 409)
      }
      throw new MobileApiError('QUIZ_SAVE_FAILED', 'Quiz attempt could not be saved.', 500)
    }

    const course = await getCourseById(quiz.course_id, { includeUnpublished: true })
    if (course) await evaluateCourseCompletion(course as Course, context.user.id)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_quiz_submitted',
      entityType: 'quiz_attempt',
      entityId: attempt.id,
      metadata: { quizId, courseId: quiz.course_id, score, passed },
    })

    return createMobileApiResponse(
      {
        attempt: {
          id: attempt.id,
          quizId,
          courseId: quiz.course_id,
          score,
          passed,
          correct,
          total: quizQuestions.length,
          createdAt: attempt.created_at,
        },
      },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
