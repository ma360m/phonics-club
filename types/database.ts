export type UserRole = 'user' | 'admin'
export type CoursePaymentStatus =
  | 'pending'
  | 'processing'
  | 'submitted'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'rejected'
  | 'refunded'
export type CourseEnrollmentStatus = 'pending' | 'active' | 'completed' | 'expired' | 'cancelled' | 'refunded'
export type AssignmentSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'graded'
  | 'returned'
  | 'resubmission_required'
  | 'late'
export type AssignmentQuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'true_false'
  | 'numeric'
  | 'file_upload'
export type OfflineActivityStatus = 'draft' | 'submitted' | 'approved' | 'partially_approved' | 'rejected'
export type LmsResourceScope = 'course' | 'module' | 'lesson' | 'quiz' | 'assignment'
export type LmsResourceVisibility = 'public' | 'enrolled' | 'paid' | 'admin'
export type LmsVideoSourceType = 'external' | 'storage'
export type CertificateStatus = 'issued' | 'revoked' | 'reissued'
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_review'
  | 'payment_confirmed'
  | 'processing'
  | 'ready_to_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string
  isbn?: string | null
  images: string[]
  stock: number
  featured: boolean
  published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CourseTrack {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url?: string | null
  banner_url?: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface CourseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon?: string | null
  parent_id?: string | null
  track_id?: string | null
  stage?: string | null
  thumbnail_url?: string | null
  banner_url?: string | null
  sort_order: number
  published?: boolean
  created_at: string
  updated_at?: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  subtitle?: string | null
  excerpt: string | null
  rich_description?: string | null
  price: number
  discounted_price?: number | null
  currency?: string
  category: string
  level: string
  language?: string
  duration: string | null
  instructor: string | null
  instructor_bio?: string | null
  instructor_avatar?: string | null
  image_url: string | null
  thumbnail_url?: string | null
  banner_url?: string | null
  curriculum: CurriculumModule[]
  objectives?: string[]
  requirements?: string[]
  seo_title?: string | null
  seo_description?: string | null
  track_id?: string | null
  category_id?: string | null
  target_audience?: string[]
  instructor_image_url?: string | null
  certificate_background_url?: string | null
  hero_video_url?: string | null
  rating?: number
  students_count?: number
  is_free?: boolean
  certificate_enabled?: boolean
  enrolment_opens_at?: string | null
  enrolment_closes_at?: string | null
  max_students?: number | null
  access_duration_days?: number
  required_online_minutes?: number
  required_offline_minutes?: number
  passing_quiz_percentage?: number
  required_assignment_passes?: number
  completion_requires_lessons?: boolean
  completion_requires_online_minutes?: boolean
  completion_requires_offline_minutes?: boolean
  completion_requires_quiz?: boolean
  completion_requires_assignments?: boolean
  completion_requires_active_enrollment?: boolean
  completion_requires_instructor_approval?: boolean
  daily_online_minutes_cap?: number
  inactivity_timeout_seconds?: number
  max_offline_entry_minutes?: number
  offline_evidence_required?: boolean
  expiry_warning_days?: number[]
  featured: boolean
  published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CurriculumLesson {
  title: string
  duration?: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  material_url?: string
}

export interface CurriculumModule {
  title: string
  duration?: string
  thumbnail_url?: string
  lessons: CurriculumLesson[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: string
  tags: string[]
  cover_image: string | null
  author_id: string | null
  published: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

export interface Order {
  id: string
  user_id: string | null
  guest_email?: string | null
  access_token?: string | null
  status: OrderStatus
  total: number
  subtotal?: number
  shipping_fee?: number
  discount_amount?: number
  coupon_code?: string | null
  member_id?: string | null
  payment_method?: string
  phone?: string | null
  receipt_url?: string | null
  invoice_number?: string | null
  items: OrderItem[]
  shipping_address: Record<string, string> | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
  discount_amount?: number
  discount_percent?: number
}

export interface Trainer {
  id: string
  name: string
  slug?: string | null
  title: string | null
  bio: string | null
  image_url: string | null
  achievements?: string[] | null
  credentials?: string[] | null
  specialties?: string[] | null
  profile_details?: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  products?: Product
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  status?: CourseEnrollmentStatus
  payment_status?: string | null
  purchase_date?: string | null
  activated_at?: string | null
  expires_at?: string | null
  completed_at?: string | null
  last_accessed_at?: string | null
  access_extended_until?: string | null
  payment_id?: string | null
  admin_notes?: string | null
  enrolled_at: string
  courses?: Course
}

export type LessonType =
  | 'video'
  | 'pdf'
  | 'notes'
  | 'quiz'
  | 'assignment'
  | 'reading'
  | 'flipbook'
  | 'presentation'
  | 'interactive'
  | 'download'
  | 'live_class'
  | 'external_link'

export type LessonReadingType =
  | 'rich_article'
  | 'pdf_viewer'
  | 'flipbook'
  | 'powerpoint_slides'
  | 'interactive_presentation'

export interface CourseModuleRow {
  id: string
  course_id: string
  title: string
  description: string | null
  thumbnail_url?: string | null
  transition_style?: 'fade' | 'slide' | 'unlock' | 'progress'
  unlock_animation?: 'none' | 'progress-ring' | 'confetti' | 'slide-unlock'
  sort_order: number
  created_at: string
  updated_at: string
  course_lessons?: CourseLesson[]
  lessons?: CourseLesson[]
}

export interface CourseLesson {
  id: string
  module_id: string
  course_id: string
  title: string
  description: string | null
  rich_content?: string | null
  lesson_type: LessonType
  thumbnail_url?: string | null
  reading_type?: LessonReadingType | null
  reading_storage_bucket?: string | null
  reading_storage_path?: string | null
  reading_external_url?: string | null
  article_content?: string | null
  presentation_data?: Record<string, unknown>
  activity_data?: Record<string, unknown>
  practice_prompt?: string | null
  discussion_prompt?: string | null
  live_session_url?: string | null
  external_link_url?: string | null
  video_url: string | null
  material_url: string | null
  content: string | null
  objectives?: string[]
  duration_minutes: number
  sort_order: number
  is_preview: boolean
  is_compulsory?: boolean
  is_optional?: boolean
  sequentially_locked?: boolean
  manual_completion_allowed?: boolean
  completion_mode?: 'manual' | 'content_threshold' | 'video_threshold'
  required_completion_percentage?: number
  downloadable?: boolean
  published?: boolean
  bookmark_enabled?: boolean
  highlight_enabled?: boolean
  print_enabled?: boolean
  download_enabled?: boolean
  dark_mode_enabled?: boolean
  fullscreen_enabled?: boolean
  search_enabled?: boolean
  zoom_enabled?: boolean
  completion_animation?: 'none' | 'progress-ring' | 'confetti' | 'unlock'
  confetti_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  watch_position: number
  content_progress_percentage?: number
  online_seconds?: number
  video_seconds?: number
  video_percentage?: number
  completed_at: string | null
  last_accessed_at?: string | null
  updated_at: string
}

export interface LessonNote {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface LessonBookmark {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  title: string
  position_seconds: number
  page_number?: number | null
  note?: string | null
  created_at: string
}

export interface LessonHighlight {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  quote: string
  note?: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface LessonDiscussion {
  id: string
  course_id: string
  lesson_id: string
  user_id: string
  parent_id?: string | null
  body: string
  pinned: boolean
  hidden: boolean
  created_at: string
  updated_at: string
}

export interface CourseReview {
  id: string
  course_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  student_name: string
  course_title: string
  instructor_name: string | null
  issued_at: string
  pdf_url: string | null
  status?: CertificateStatus
  template_id?: string | null
  completion_status_id?: string | null
  online_minutes?: number
  offline_minutes?: number
  final_score?: number | null
  verification_code?: string | null
  verification_url?: string | null
  pdf_bucket?: string | null
  pdf_path?: string | null
  revoked_at?: string | null
  revoked_by?: string | null
  revoke_reason?: string | null
  reissued_from_certificate_id?: string | null
}

export interface CourseResource {
  id: string
  course_id: string
  module_id?: string | null
  lesson_id: string | null
  quiz_id?: string | null
  assignment_id?: string | null
  scope?: LmsResourceScope
  title: string
  description?: string | null
  resource_url: string | null
  resource_type: string
  storage_bucket?: string | null
  storage_path?: string | null
  external_url?: string | null
  original_filename?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
  visibility?: LmsResourceVisibility
  is_downloadable: boolean
  is_compulsory?: boolean
  is_view_only?: boolean
  replaced_by_resource_id?: string | null
  uploaded_by?: string | null
  sort_order: number
  created_at: string
  updated_at?: string
}

export interface CourseQuiz {
  id: string
  course_id: string
  lesson_id: string | null
  title: string
  description: string | null
  passing_score: number
  max_attempts: number
  timer_minutes?: number | null
  randomize_questions?: boolean
  randomize_options?: boolean
  show_explanations?: boolean
  allow_review?: boolean
  question_bank_enabled?: boolean
  thumbnail_url?: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export type QuizQuestionType =
  | 'mcq'
  | 'multiple_select'
  | 'true_false'
  | 'matching'
  | 'drag_drop'
  | 'ordering'
  | 'fill_blank'
  | 'image'
  | 'audio'
  | 'scenario'

export interface QuizQuestion {
  id: string
  quiz_id: string
  bank_id?: string | null
  question: string
  question_type?: QuizQuestionType
  options: string[]
  correct_option?: number
  correct_options?: number[]
  acceptable_answers?: string[]
  matching_pairs?: Array<Record<string, unknown>>
  media_url?: string | null
  image_url?: string | null
  audio_url?: string | null
  points?: number
  difficulty?: 'easy' | 'standard' | 'hard'
  explanation: string | null
  sort_order: number
  created_at: string
}

export interface QuestionBank {
  id: string
  course_id: string
  title: string
  slug: string
  description: string | null
  sort_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  course_id: string
  user_id: string
  score: number
  passed: boolean
  answers: Record<string, number | number[] | string>
  attempt_number: number
  created_at: string
}

export interface CourseWishlistItem {
  id: string
  user_id: string
  course_id: string
  created_at: string
  courses?: Course
}

export interface CourseVideo {
  id: string
  course_id: string
  module_id: string | null
  lesson_id: string | null
  title: string
  source_type: LmsVideoSourceType
  external_url: string | null
  storage_bucket: string | null
  storage_path: string | null
  duration_seconds: number
  thumbnail_url: string | null
  sort_order: number
  compulsory: boolean
  required_completion_percentage: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface VideoProgress {
  id: string
  video_id: string
  course_id: string
  lesson_id: string | null
  user_id: string
  last_position_seconds: number
  active_watch_seconds: number
  watched_percentage: number
  completed: boolean
  completed_at: string | null
  updated_at: string
}

export interface CoursePayment {
  id: string
  user_id: string
  course_id: string
  enrollment_id: string | null
  amount: number
  currency: string
  status: CoursePaymentStatus
  payment_method: string
  provider: string
  gateway_session_id: string | null
  gateway_reference: string | null
  transaction_reference: string | null
  idempotency_key: string
  receipt_bucket: string | null
  receipt_path: string | null
  receipt_url: string | null
  receipt_filename: string | null
  receipt_mime_type: string | null
  receipt_size_bytes: number | null
  submitted_at: string | null
  verified_at: string | null
  rejected_at: string | null
  refunded_at: string | null
  approved_by: string | null
  admin_note: string | null
  rejection_reason: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  courses?: Course
  profiles?: Pick<Profile, 'full_name' | 'email'> | null
}

export interface CoursePaymentEvent {
  id: string
  payment_id: string
  course_id: string
  user_id: string
  previous_status: CoursePaymentStatus | null
  new_status: CoursePaymentStatus
  event_type: string
  actor_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface CourseInvoice {
  id: string
  payment_id: string
  course_id: string
  user_id: string
  invoice_number: string
  amount: number
  currency: string
  pdf_bucket: string | null
  pdf_path: string | null
  issued_at: string
  created_at: string
}

export interface CourseAssignment {
  id: string
  course_id: string
  module_id: string | null
  lesson_id: string | null
  title: string
  instructions: string | null
  opens_at: string | null
  due_at: string | null
  total_marks: number
  passing_marks: number
  max_attempts: number
  allow_late_submissions: boolean
  late_penalty_percent: number
  allow_drafts: boolean
  allow_text_submissions: boolean
  allow_file_submissions: boolean
  allowed_mime_types: string[]
  max_upload_size_bytes: number
  model_answer: string | null
  marking_guide: string | null
  allow_resubmission: boolean
  feedback_release_at: string | null
  feedback_released: boolean
  compulsory: boolean
  published: boolean
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AssignmentQuestion {
  id: string
  assignment_id: string
  question_type: AssignmentQuestionType
  prompt: string
  options: unknown[]
  correct_answer: unknown
  points: number
  required: boolean
  sort_order: number
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  course_id: string
  user_id: string
  attempt_number: number
  status: AssignmentSubmissionStatus
  submitted_at: string | null
  late: boolean
  total_awarded_marks: number | null
  passed: boolean | null
  overall_feedback: string | null
  feedback_released: boolean
  released_at: string | null
  graded_by: string | null
  graded_at: string | null
  created_at: string
  updated_at: string
  course_assignments?: CourseAssignment
}

export interface AssignmentAnswer {
  id: string
  submission_id: string
  question_id: string
  answer: unknown
  awarded_marks: number | null
  feedback: string | null
  grading_draft: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AssignmentFile {
  id: string
  submission_id: string
  question_id: string | null
  storage_bucket: string
  storage_path: string
  original_filename: string
  mime_type: string | null
  file_size_bytes: number
  uploaded_at: string
}

export interface AssignmentGrade {
  id: string
  submission_id: string
  assignment_id: string
  course_id: string
  user_id: string
  grader_id: string | null
  total_marks: number
  awarded_marks: number
  passed: boolean
  feedback: string | null
  released: boolean
  released_at: string | null
  created_at: string
  updated_at: string
}

export interface LearningSession {
  id: string
  user_id: string
  course_id: string
  lesson_id: string | null
  enrollment_id: string | null
  device_id: string
  started_at: string
  last_heartbeat_at: string | null
  ended_at: string | null
  credited_seconds: number
  inactivity_seconds: number
  status: 'active' | 'paused' | 'ended' | 'flagged'
  validation_flags: string[]
  suspicious: boolean
  created_at: string
}

export interface LearningHeartbeat {
  id: string
  session_id: string
  user_id: string
  course_id: string
  lesson_id: string | null
  heartbeat_id: string
  client_sent_at: string | null
  received_at: string
  credited_seconds: number
  visible: boolean
  focused: boolean
  active: boolean
  route: string | null
  validation_flags: string[]
  suspicious: boolean
}

export interface LessonTimeTotal {
  id: string
  user_id: string
  course_id: string
  lesson_id: string | null
  approved_seconds: number
  last_activity_at: string | null
  updated_at: string
}

export interface OfflineActivityEntry {
  id: string
  user_id: string
  course_id: string
  module_id: string | null
  lesson_id: string | null
  activity_date: string
  start_time: string
  end_time: string
  claimed_minutes: number
  approved_minutes: number
  activity_type: string
  description: string | null
  student_declaration: boolean
  status: OfflineActivityStatus
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  adjustment_reason: string | null
  created_at: string
  updated_at: string
}

export interface CourseCompletionStatus {
  id: string
  user_id: string
  course_id: string
  enrollment_id: string | null
  lessons_completed: number
  lessons_required: number
  online_minutes: number
  offline_minutes: number
  final_quiz_score: number | null
  required_assignments_passed: number
  required_assignments_total: number
  instructor_approved: boolean
  eligible_for_certificate: boolean
  completed: boolean
  checklist: Record<string, unknown>
  evaluated_at: string
}

export interface NewsletterIssue {
  id: string
  title: string
  month: number
  year: number
  file_url: string
  file_path: string
  file_size: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      courses: { Row: Course; Insert: Partial<Course>; Update: Partial<Course> }
      blog_posts: { Row: BlogPost; Insert: Partial<BlogPost>; Update: Partial<BlogPost> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      cart_items: { Row: CartItem; Insert: Partial<CartItem>; Update: Partial<CartItem> }
      wishlist_items: { Row: WishlistItem; Insert: Partial<WishlistItem>; Update: Partial<WishlistItem> }
      enrollments: { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment> }
      course_tracks: { Row: CourseTrack; Insert: Partial<CourseTrack>; Update: Partial<CourseTrack> }
      course_categories: { Row: CourseCategory; Insert: Partial<CourseCategory>; Update: Partial<CourseCategory> }
      course_modules: { Row: CourseModuleRow; Insert: Partial<CourseModuleRow>; Update: Partial<CourseModuleRow> }
      course_lessons: { Row: CourseLesson; Insert: Partial<CourseLesson>; Update: Partial<CourseLesson> }
      lesson_progress: { Row: LessonProgress; Insert: Partial<LessonProgress>; Update: Partial<LessonProgress> }
      lesson_notes: { Row: LessonNote; Insert: Partial<LessonNote>; Update: Partial<LessonNote> }
      lesson_bookmarks: { Row: LessonBookmark; Insert: Partial<LessonBookmark>; Update: Partial<LessonBookmark> }
      lesson_highlights: { Row: LessonHighlight; Insert: Partial<LessonHighlight>; Update: Partial<LessonHighlight> }
      lesson_discussions: { Row: LessonDiscussion; Insert: Partial<LessonDiscussion>; Update: Partial<LessonDiscussion> }
      course_reviews: { Row: CourseReview; Insert: Partial<CourseReview>; Update: Partial<CourseReview> }
      certificates: { Row: Certificate; Insert: Partial<Certificate>; Update: Partial<Certificate> }
      course_resources: { Row: CourseResource; Insert: Partial<CourseResource>; Update: Partial<CourseResource> }
      course_quizzes: { Row: CourseQuiz; Insert: Partial<CourseQuiz>; Update: Partial<CourseQuiz> }
      question_banks: { Row: QuestionBank; Insert: Partial<QuestionBank>; Update: Partial<QuestionBank> }
      quiz_questions: { Row: QuizQuestion; Insert: Partial<QuizQuestion>; Update: Partial<QuizQuestion> }
      quiz_attempts: { Row: QuizAttempt; Insert: Partial<QuizAttempt>; Update: Partial<QuizAttempt> }
      course_wishlists: { Row: CourseWishlistItem; Insert: Partial<CourseWishlistItem>; Update: Partial<CourseWishlistItem> }
      course_videos: { Row: CourseVideo; Insert: Partial<CourseVideo>; Update: Partial<CourseVideo> }
      video_progress: { Row: VideoProgress; Insert: Partial<VideoProgress>; Update: Partial<VideoProgress> }
      course_payments: { Row: CoursePayment; Insert: Partial<CoursePayment>; Update: Partial<CoursePayment> }
      course_payment_events: { Row: CoursePaymentEvent; Insert: Partial<CoursePaymentEvent>; Update: Partial<CoursePaymentEvent> }
      course_invoices: { Row: CourseInvoice; Insert: Partial<CourseInvoice>; Update: Partial<CourseInvoice> }
      course_assignments: { Row: CourseAssignment; Insert: Partial<CourseAssignment>; Update: Partial<CourseAssignment> }
      assignment_questions: { Row: AssignmentQuestion; Insert: Partial<AssignmentQuestion>; Update: Partial<AssignmentQuestion> }
      assignment_submissions: { Row: AssignmentSubmission; Insert: Partial<AssignmentSubmission>; Update: Partial<AssignmentSubmission> }
      assignment_answers: { Row: AssignmentAnswer; Insert: Partial<AssignmentAnswer>; Update: Partial<AssignmentAnswer> }
      assignment_files: { Row: AssignmentFile; Insert: Partial<AssignmentFile>; Update: Partial<AssignmentFile> }
      assignment_grades: { Row: AssignmentGrade; Insert: Partial<AssignmentGrade>; Update: Partial<AssignmentGrade> }
      learning_sessions: { Row: LearningSession; Insert: Partial<LearningSession>; Update: Partial<LearningSession> }
      learning_heartbeats: { Row: LearningHeartbeat; Insert: Partial<LearningHeartbeat>; Update: Partial<LearningHeartbeat> }
      lesson_time_totals: { Row: LessonTimeTotal; Insert: Partial<LessonTimeTotal>; Update: Partial<LessonTimeTotal> }
      offline_activity_entries: { Row: OfflineActivityEntry; Insert: Partial<OfflineActivityEntry>; Update: Partial<OfflineActivityEntry> }
      course_completion_status: { Row: CourseCompletionStatus; Insert: Partial<CourseCompletionStatus>; Update: Partial<CourseCompletionStatus> }
      newsletter_issues: { Row: NewsletterIssue; Insert: Partial<NewsletterIssue>; Update: Partial<NewsletterIssue> }
      trainers: { Row: Trainer; Insert: Partial<Trainer>; Update: Partial<Trainer> }
    }
  }
}
