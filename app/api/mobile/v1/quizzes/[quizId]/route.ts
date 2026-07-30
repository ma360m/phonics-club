import { isEnrollmentActive } from '@/lib/lms'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { quizId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'quiz-fetch', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const { data: quiz } = await context.supabase
      .from('course_quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('published', true)
      .maybeSingle()

    if (!quiz) throw new MobileApiError('QUIZ_NOT_FOUND', 'Quiz could not be found.', 404)

    const [{ data: enrollment }, { data: lesson }, { data: questions }, { count: attempts }] = await Promise.all([
      context.supabase.from('enrollments').select('*').eq('user_id', context.user.id).eq('course_id', quiz.course_id).maybeSingle(),
      quiz.lesson_id
        ? context.supabase.from('course_lessons').select('id, is_preview').eq('id', quiz.lesson_id).maybeSingle()
        : Promise.resolve({ data: null }),
      context.supabase
        .from('quiz_questions')
        .select('id, quiz_id, question, question_type, options, media_url, image_url, audio_url, points, difficulty, sort_order')
        .eq('quiz_id', quiz.id)
        .order('sort_order', { ascending: true }),
      context.supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id)
        .eq('user_id', context.user.id),
    ])

    if (!isEnrollmentActive(enrollment as never) && !lesson?.is_preview) {
      throw new MobileApiError('QUIZ_FORBIDDEN', 'You must be enrolled to take this quiz.', 403)
    }

    return createMobileApiResponse(
      {
        quiz: {
          id: quiz.id,
          courseId: quiz.course_id,
          lessonId: quiz.lesson_id,
          title: quiz.title,
          instructions: quiz.description,
          passingScore: quiz.passing_score,
          maxAttempts: quiz.max_attempts,
          attemptsUsed: attempts ?? 0,
          attemptsRemaining: Math.max(Number(quiz.max_attempts ?? 3) - (attempts ?? 0), 0),
          timeLimitMinutes: quiz.timer_minutes,
          randomizeQuestions: quiz.randomize_questions,
          randomizeOptions: quiz.randomize_options,
          allowReview: quiz.allow_review,
          questions: (questions ?? []).map((question) => ({
            id: question.id,
            quizId: question.quiz_id,
            question: question.question,
            questionType: question.question_type ?? 'mcq',
            options: Array.isArray(question.options) ? question.options : [],
            mediaUrl: question.media_url,
            imageUrl: question.image_url,
            audioUrl: question.audio_url,
            points: question.points,
            difficulty: question.difficulty,
            sortOrder: question.sort_order,
          })),
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
