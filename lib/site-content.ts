import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { CERTIFIED_TRAINERS, COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'

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

export interface SchoolLogo {
  id: string
  name: string
  imageUrl?: string
  href?: string
  sortOrder: number
}

export interface VortexLearning {
  title: string
  description: string
  websiteUrl: string
  courses: { title: string; description: string; href: string }[]
}

export interface HeroVideo {
  videoUrl: string
  demoButtonUrl?: string
}

export const VORTEX_LEARNING_URL = 'https://officialvortexlear.wixsite.com/vortex-learning'

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

const SCHOOL_LOGO_PATHS: Record<string, string> = {
  tns: '/images/logos/tns.jpg',
  froebels: '/images/logos/froebels.jpg',
  starfish: '/images/logos/starfish.jpg',
  quixotic: '/images/logos/quixotic.jpg',
  lgs: '/images/logos/lgs.jpg',
  beaconhouse: '/images/logos/beaconhouse.png',
  rwis: '/images/logos/RWIS.jpg',
  academus: '/images/logos/ACADEMUS.png',
  alda: '/images/logos/ALDA.png',
  horizon: '/images/logos/HORIZON.jpg',
  aksp: '/images/logos/AKSP.png',
  akrsp: '/images/logos/AKRSP.jpg',
}

const DEFAULT_SCHOOL_LOGOS: SchoolLogo[] = [
  { id: 'tns', name: 'TNS', imageUrl: SCHOOL_LOGO_PATHS.tns, sortOrder: 1 },
  { id: 'froebels', name: "Froebel's International", imageUrl: SCHOOL_LOGO_PATHS.froebels, sortOrder: 2 },
  { id: 'starfish', name: 'Starfish School', imageUrl: SCHOOL_LOGO_PATHS.starfish, sortOrder: 3 },
  { id: 'quixotic', name: 'Quixotic Academy', imageUrl: SCHOOL_LOGO_PATHS.quixotic, sortOrder: 4 },
  { id: 'lgs', name: 'LGS', imageUrl: SCHOOL_LOGO_PATHS.lgs, sortOrder: 5 },
  { id: 'beaconhouse', name: 'Beaconhouse', imageUrl: SCHOOL_LOGO_PATHS.beaconhouse, sortOrder: 6 },
  { id: 'rwis', name: 'RWIS', imageUrl: SCHOOL_LOGO_PATHS.rwis, sortOrder: 7 },
  { id: 'dynamic', name: 'Dynamic International', imageUrl: '', sortOrder: 8 },
  { id: 'academus', name: 'Academus', imageUrl: SCHOOL_LOGO_PATHS.academus, sortOrder: 9 },
  { id: 'alda', name: 'ALDA', imageUrl: SCHOOL_LOGO_PATHS.alda, sortOrder: 10 },
  { id: 'horizon', name: 'Horizon School System', imageUrl: SCHOOL_LOGO_PATHS.horizon, sortOrder: 11 },
  { id: 'aksp', name: 'AKSP', imageUrl: SCHOOL_LOGO_PATHS.aksp, sortOrder: 12 },
  { id: 'akrsp', name: 'AKRSP', imageUrl: SCHOOL_LOGO_PATHS.akrsp, sortOrder: 13 },
]

const DEFAULT_VORTEX: VortexLearning = {
  title: 'Vortex Learning Partnership',
  description:
    'In collaboration with Vortex Learning — a leading online education platform offering live teachers, interactive courses, and professional development for students and educators across Pakistan.',
  websiteUrl: VORTEX_LEARNING_URL,
  courses: [
    { title: 'Live Online Tutoring', description: 'One-on-one and group sessions with certified teachers', href: '/courses' },
    { title: 'Professional Development', description: 'CPD courses for educators', href: '/courses?category=teacher-courses' },
    { title: 'Student Programs', description: 'Structured learning paths for all ages', href: '/courses' },
  ],
}

const DEFAULT_HERO_VIDEO: HeroVideo = {
  videoUrl: 'https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa',
  demoButtonUrl: 'https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf',
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

function logoIdFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeLogoUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || /\s/.test(trimmed) || trimmed === '/images/schools/logo.png') return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/public/')) return trimmed.replace(/^\/public/, '')
  if (trimmed.startsWith('public/')) return `/${trimmed.replace(/^public\//, '')}`
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  return ''
}

function normalizeSchoolLogo(logo: SchoolLogo, index: number): SchoolLogo {
  const id = logo.id || logoIdFromName(logo.name)
  const normalizedUrl = normalizeLogoUrl(logo.imageUrl)
  const imageUrl = /^https?:\/\//i.test(normalizedUrl)
    ? normalizedUrl
    : SCHOOL_LOGO_PATHS[id] ?? normalizedUrl

  return {
    ...logo,
    id,
    imageUrl,
    sortOrder: Number(logo.sortOrder) || index + 1,
  }
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

export async function getSchoolLogos(): Promise<SchoolLogo[]> {
  const logos = await getContent('school_logos', DEFAULT_SCHOOL_LOGOS)
  return [...logos]
    .map(normalizeSchoolLogo)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export async function getVortexLearning(): Promise<VortexLearning> {
  const data = await getContent('vortex_learning', DEFAULT_VORTEX)
  return { ...data, websiteUrl: VORTEX_LEARNING_URL }
}

export async function getHeroVideo(): Promise<HeroVideo> {
  return getContent('hero_video', DEFAULT_HERO_VIDEO)
}

export async function getInvoiceTemplate() {
  return getContent('invoice_template', {
    header: 'PHONICS CLUB PVT LTD',
    tagline: COMPANY.tagline,
    footer:
      'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight. Current standard shipping: PKR 550.',
    bankDetails: COMPANY_BANK_DETAILS,
  })
}

export async function getBankDetails() {
  return getContent('bank_details', COMPANY_BANK_DETAILS)
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
