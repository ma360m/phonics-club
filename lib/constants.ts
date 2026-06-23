export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'PHONICS CLUB'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const APP_DESCRIPTION =
  'Phonics Club Pvt Ltd — official Jolly Phonics & Grammar distributor. Training, support and consultancy for synthetic phonics in Pakistan.'

export const PRODUCT_CATEGORIES = [
  'activity-books',
  'pupil-books',
  'workbooks',
  'grammar-workbooks',
  'grammar-pupil-books',
  'teachers-books',
  'comprehension',
  'readers',
  'teacher-resources',
  'kits',
] as const

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  'activity-books': 'Activity Books',
  'pupil-books': 'Pupil Books',
  'workbooks': 'Jolly Phonics Workbooks',
  'grammar-workbooks': 'Grammar Workbooks',
  'grammar-pupil-books': 'Grammar & Spelling Pupil Books',
  'teachers-books': "Teacher's Books",
  'comprehension': 'Comprehension & Creative Writing',
  'readers': 'Jolly Phonics Readers',
  'teacher-resources': 'Teacher Resources',
  'kits': 'Kits & Classroom Sets',
}

export const COURSE_CATEGORIES = [
  'teacher-courses',
  'phonics',
  'reading',
  'preschool',
  'general',
] as const

export const BLOG_CATEGORIES = [
  'phonics-tips',
  'parenting',
  'teaching',
  'news',
  'general',
] as const

export const ADMIN_ROUTES = ['/admin'] as const
export const PROTECTED_ROUTES = ['/dashboard', '/wishlist', '/admin'] as const
export const AUTH_ROUTES = ['/auth/login', '/auth/signup'] as const
