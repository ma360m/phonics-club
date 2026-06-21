import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { CERTIFIED_TRAINERS, COMPANY } from '@/lib/company'

export interface Announcement {
  id: string
  message: string
  linkUrl?: string
  linkText?: string
  couponCode?: string
  active: boolean
}

export interface Testimonial {
  id: string
  content: string
  author: string
  role: string
  rating: number
  imageUrl?: string
}

export interface SocialReel {
  id: string
  thumbnail: string
  videoUrl: string
  title: string
}

export interface VortexLearning {
  title: string
  description: string
  websiteUrl: string
  courses: { title: string; description: string; href: string }[]
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: '1', content: 'Phonics Club transformed our school reading program. Jolly Phonics implementation was seamless.', author: 'Beaconhouse School', role: 'Lahore', rating: 5 },
  { id: '2', content: 'The training and materials from Phonics Club are exceptional. Our teachers are confident teaching synthetic phonics.', author: 'LGS Faculty', role: 'Lahore Grammar School', rating: 5 },
  { id: '3', content: 'Best phonics resources in Pakistan. Authorized dealer with full PCTB NOC support.', author: "Froebel's International", role: 'Islamabad', rating: 5 },
]

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', message: 'Official Jolly Phonics & Grammar distributor — PCTB approved books', linkUrl: '/shop', linkText: 'Shop Now', active: true },
]

const DEFAULT_SOCIAL_REELS: SocialReel[] = [
  { id: '1', thumbnail: '/images/schools/partners-strip-1.png', videoUrl: COMPANY.social.instagram, title: 'Phonics in action' },
  { id: '2', thumbnail: '', videoUrl: COMPANY.social.youtube, title: 'Jolly Phonics training' },
  { id: '3', thumbnail: '', videoUrl: COMPANY.social.instagram, title: 'Reading success' },
  { id: '4', thumbnail: '', videoUrl: COMPANY.social.facebook, title: 'Teacher workshop' },
  { id: '5', thumbnail: '', videoUrl: COMPANY.social.instagram, title: 'Student progress' },
  { id: '6', thumbnail: '', videoUrl: COMPANY.social.youtube, title: 'Phonics Club community' },
]

const DEFAULT_VORTEX: VortexLearning = {
  title: 'Vortex Learning Partnership',
  description:
    'In collaboration with Vortex Learning — a leading online education platform offering live teachers, interactive courses, and professional development for students and educators across Pakistan.',
  websiteUrl: 'https://vortexlearning.com',
  courses: [
    { title: 'Live Online Tutoring', description: 'One-on-one and group sessions with certified teachers', href: '/courses' },
    { title: 'Professional Development', description: 'CPD courses for educators', href: '/courses?category=teacher-courses' },
    { title: 'Student Programs', description: 'Structured learning paths for all ages', href: '/courses' },
  ],
}

async function getContent<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_content').select('content').eq('key', key).single()
    if (data?.content) return data.content as T
  } catch {
    /* use fallback */
  }
  return fallback
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const items = await getContent<Announcement[]>('announcements', DEFAULT_ANNOUNCEMENTS)
  return items.filter((a) => a.active)
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return getContent('testimonials', DEFAULT_TESTIMONIALS)
}

export async function getSocialReels(): Promise<SocialReel[]> {
  return getContent('social_reels', DEFAULT_SOCIAL_REELS)
}

export async function getVortexLearning(): Promise<VortexLearning> {
  return getContent('vortex_learning', DEFAULT_VORTEX)
}

export async function getInvoiceTemplate() {
  return getContent('invoice_template', {
    header: 'PHONICS CLUB PVT LTD',
    tagline: COMPANY.tagline,
    footer:
      'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight. Current standard shipping: PKR 5,500.',
  })
}

export async function getBankDetails() {
  return getContent('bank_details', {
    bankName: 'Meezan Bank',
    accountTitle: 'Phonics Club Pvt Ltd',
    accountNumber: '01234567890123',
    iban: 'PK00MEZN0001234567890123',
    instructions: 'Transfer the exact order total and upload your payment receipt. Orders process after admin confirms payment.',
  })
}

export async function getTrainers() {
  if (!isSupabaseConfigured()) {
    return CERTIFIED_TRAINERS.map((name, i) => ({
      id: String(i + 1),
      name,
      title: 'Certified Jolly Phonics Trainer',
      bio: null,
      image_url: null,
      sort_order: i,
      published: true,
    }))
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('trainers')
    .select('*')
    .eq('published', true)
    .order('sort_order')
  return data ?? []
}

export async function getSiteContentKey(key: string) {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('site_content').select('*').eq('key', key).single()
  return data
}

export async function getAllSiteContent() {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase.from('site_content').select('*')
  return data ?? []
}
