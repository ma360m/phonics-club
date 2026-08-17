import { createServiceClient } from '@/lib/supabase/server'
import { notifyAdminOfTrainingRegistration } from '@/lib/email/send-training-registration-admin-email'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileTrainingRegistrationSchema, normalizeEmail } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

async function optionalMobileUserId(request: Request) {
  if (!request.headers.get('authorization')) return null
  try {
    const context = await requireMobileUser(request)
    return context.user.id
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trainingId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { trainingId } = await params
    const parsed = mobileTrainingRegistrationSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid training registration.', 400)
    }

    const normalizedEmail = normalizeEmail(parsed.data.email)
    enforceMobileRateLimit(request, 'training-registration', { identifier: normalizedEmail, limit: 5, windowMs: 300_000 })

    if (parsed.data.eventDate && new Date(parsed.data.eventDate).getTime() < Date.now() - 86_400_000) {
      throw new MobileApiError('TRAINING_DATE_CLOSED', 'Registration for this training date is closed.', 409)
    }

    const supabase = await createServiceClient()
    const eventTitle = parsed.data.eventTitle || trainingId
    const { data: duplicate } = await supabase
      .from('training_registrations')
      .select('id')
      .eq('normalized_email', normalizedEmail)
      .eq('training_type', parsed.data.trainingType)
      .eq('event_title', eventTitle)
      .maybeSingle()

    if (duplicate) {
      throw new MobileApiError('TRAINING_DUPLICATE', 'A registration for this email already exists.', 409)
    }

    const userId = await optionalMobileUserId(request)
    const { data: registration, error } = await supabase
      .from('training_registrations')
      .insert({
        user_id: userId,
        training_type: parsed.data.trainingType,
        event_title: eventTitle,
        event_date: parsed.data.eventDate || null,
        preferred_month: parsed.data.preferredMonth,
        approx_participants: parsed.data.approxParticipants,
        full_name: parsed.data.fullName,
        email: parsed.data.email.trim(),
        normalized_email: normalizedEmail,
        phone: parsed.data.phone ?? null,
        organization: parsed.data.organization ?? null,
        message: parsed.data.message ?? null,
        status: 'pending',
      } as never)
      .select('id, status, created_at')
      .single()

    if (error || !registration) {
      throw new MobileApiError('TRAINING_SAVE_FAILED', 'Training registration could not be saved.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId,
      eventType: 'mobile_training_registration_created',
      entityType: 'training_registration',
      entityId: registration.id,
      metadata: { trainingId, trainingType: parsed.data.trainingType },
    })

    await notifyAdminOfTrainingRegistration({
      registrationId: registration.id,
      userId,
      trainingType: parsed.data.trainingType,
      eventTitle,
      eventDate: parsed.data.eventDate || null,
      preferredMonth: parsed.data.preferredMonth,
      approxParticipants: parsed.data.approxParticipants,
      fullName: parsed.data.fullName,
      email: parsed.data.email.trim(),
      phone: parsed.data.phone ?? null,
      organization: parsed.data.organization ?? null,
      message: parsed.data.message ?? null,
      source: 'Mobile app training registration',
      requestedAt: registration.created_at,
    })

    return createMobileApiResponse(
      {
        registration: {
          id: registration.id,
          status: registration.status,
          createdAt: registration.created_at,
        },
      },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
