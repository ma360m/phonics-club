import { z } from 'zod'
import { checkoutPaymentMethods } from '@/lib/validations/checkout'

export const uuidSchema = z.string().uuid()

export const mobilePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export const mobileAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal('')).default(''),
  phone: z.string().trim().min(7).max(40),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(120),
  zip: z.string().trim().max(40).optional().default(''),
  country: z.string().trim().min(2).max(120).default('Pakistan'),
})

export const mobileCartItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1).max(100),
})

export const mobileCheckoutSchema = z.object({
  items: z.array(mobileCartItemSchema).min(1).max(100),
  deliveryAddress: mobileAddressSchema,
  billingDetails: mobileAddressSchema.partial().optional(),
  paymentMethodId: z.enum(checkoutPaymentMethods),
  voucherCode: z.string().trim().max(64).optional(),
  customerNotes: z.string().trim().max(1000).optional(),
  selectedDisplayCurrency: z.enum(['PKR', 'USD']).default('PKR'),
  idempotencyKey: z.string().trim().min(12).max(120),
})

export const mobileReceiptMetadataSchema = z.object({
  transactionReference: z.string().trim().max(160).optional(),
})

export const mobileCoursePaymentCheckoutSchema = z.object({
  courseId: uuidSchema,
  paymentMethodId: z.string().trim().max(80).default('manual_bank_transfer'),
  selectedDisplayCurrency: z.enum(['PKR', 'USD']).default('PKR'),
  idempotencyKey: z.string().trim().min(12).max(160),
})

export const mobileQuizSubmitSchema = z.object({
  answers: z.record(z.union([
    z.number().int(),
    z.array(z.number().int()),
    z.string().max(5000),
  ])),
  attemptId: z.string().trim().max(160).optional(),
  clientStartedAt: z.string().datetime().optional(),
  clientSubmittedAt: z.string().datetime().optional(),
})

export const mobileLearningSessionStartSchema = z.object({
  courseId: uuidSchema,
  lessonId: uuidSchema.nullish(),
  deviceId: z.string().trim().min(1).max(160),
})

export const mobileLearningHeartbeatSchema = z.object({
  heartbeatId: z.string().trim().min(8).max(160),
  courseId: uuidSchema,
  lessonId: uuidSchema.nullish(),
  visible: z.boolean(),
  focused: z.boolean(),
  active: z.boolean(),
  route: z.string().trim().max(500).default('mobile'),
  clientSentAt: z.string().datetime().nullish(),
})

export const mobileTrainingRegistrationSchema = z.object({
  trainingType: z.enum(['online_webinar', 'onsite_classroom']),
  eventTitle: z.string().trim().min(2).max(200),
  eventDate: z.string().optional(),
  preferredMonth: z.string().trim().min(3).max(40),
  approxParticipants: z.number().int().min(1).max(10_000),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
})

export const mobileNewsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).default('mobile'),
  consentMetadata: z.record(z.unknown()).optional().default({}),
})

export const mobileNewsletterUnsubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
})

export const mobilePushTokenRegistrationSchema = z.object({
  expoPushToken: z.string().trim().min(20).max(255),
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
  appVersion: z.string().trim().max(40).default(''),
  deviceName: z.string().trim().max(120).optional(),
  locale: z.string().trim().max(40).optional(),
  timezone: z.string().trim().max(80).optional(),
})

export const mobileAdminProductPriceSchema = z.object({
  price: z.coerce.number().min(0).max(10_000_000),
  salePrice: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
  reason: z.string().trim().min(3).max(500),
}).strict()

export const mobileAdminInventoryAdjustmentSchema = z.object({
  adjustmentType: z.enum([
    'add_stock',
    'remove_stock',
    'correction',
    'damaged',
    'returned',
    'received_inventory',
    'manual_adjustment',
  ]),
  quantity: z.coerce.number().int().min(-100_000).max(100_000),
  reason: z.string().trim().min(3).max(500),
}).strict()

export const mobileSupportTicketCreateSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  category: z.enum(['order', 'course', 'payment', 'technical', 'account', 'child_profile', 'other']).default('other'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  message: z.string().trim().min(3).max(5000),
  orderId: uuidSchema.optional(),
  courseId: uuidSchema.optional(),
  purchaseEnquiryId: uuidSchema.optional(),
}).strict()

export const mobileSupportTicketReplySchema = z.object({
  message: z.string().trim().min(1).max(5000),
  visibility: z.enum(['user', 'internal']).default('user'),
}).strict()

export const mobileSupportTicketUpdateSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'waiting_for_user', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedAdminId: uuidSchema.nullable().optional(),
}).strict()

export const mobileChildProfileCreateSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  ageRange: z.enum(['under_5', '5_7', '8_10', '11_13', '14_plus', 'prefer_not_to_say']),
  avatarUrl: z.string().trim().url().max(1000).optional(),
  preferences: z.record(z.unknown()).optional().default({}),
}).strict()

export const mobileChildProfileUpdateSchema = mobileChildProfileCreateSchema.partial().strict()

export const mobileAccountDeletionRequestSchema = z.object({
  selectedReason: z.string().trim().min(2).max(120),
  otherReasonDetails: z.string().trim().max(2000).optional(),
  additionalDetails: z.string().trim().max(2000).optional(),
}).strict()

export const mobileProductReviewCreateSchema = z.object({
  productId: uuidSchema,
  orderId: uuidSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(4000).optional(),
}).strict()

export const mobileAdminProductReviewUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'hidden']),
  moderationReason: z.string().trim().max(1000).optional(),
  adminResponse: z.string().trim().max(2000).optional(),
}).strict()

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}
