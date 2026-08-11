import type { CoursePaymentStatus } from '@/types/database'

export type CoursePaymentWorkflowStatus =
  | 'pending_payment'
  | 'slip_uploaded'
  | 'payment_verified'
  | 'licence_issued'

type CoursePaymentWorkflowInput = {
  status?: CoursePaymentStatus | string | null
  receipt_path?: string | null
  receipt_url?: string | null
  receipt_filename?: string | null
  submitted_at?: string | null
  verified_at?: string | null
  license_key?: string | null
  license_emailed_at?: string | null
  license_unlocked_at?: string | null
  created_at?: string | null
  registration_expires_at?: string | null
}

export const COURSE_REGISTRATION_REMINDER_DAYS = 2

export function coursePaymentHasSlip(payment: CoursePaymentWorkflowInput) {
  return Boolean(payment.receipt_path || payment.receipt_url || payment.receipt_filename || payment.submitted_at)
}

export function getCoursePaymentWorkflowStatus(payment: CoursePaymentWorkflowInput): CoursePaymentWorkflowStatus {
  if (payment.license_key || payment.license_emailed_at || payment.license_unlocked_at) return 'licence_issued'
  if (payment.status === 'paid' || payment.verified_at) return 'payment_verified'
  if (payment.status === 'submitted' || payment.status === 'processing' || coursePaymentHasSlip(payment)) {
    return 'slip_uploaded'
  }
  return 'pending_payment'
}

export function getCoursePaymentRegistrationExpiry(payment: CoursePaymentWorkflowInput) {
  if (payment.registration_expires_at) return new Date(payment.registration_expires_at)
  const createdAt = payment.created_at ? new Date(payment.created_at) : new Date()
  const expiry = new Date(createdAt)
  expiry.setDate(expiry.getDate() + COURSE_REGISTRATION_REMINDER_DAYS)
  return expiry
}

export function isCoursePaymentPendingReminderEligible(payment: CoursePaymentWorkflowInput, now = new Date()) {
  if (getCoursePaymentWorkflowStatus(payment) !== 'pending_payment') return false
  if (payment.status && payment.status !== 'pending') return false
  const createdAt = payment.created_at ? new Date(payment.created_at) : null
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false
  const dueAt = new Date(createdAt)
  dueAt.setDate(dueAt.getDate() + COURSE_REGISTRATION_REMINDER_DAYS)
  return dueAt.getTime() <= now.getTime()
}
