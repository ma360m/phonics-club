import { unstable_cache } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import {
  DEFAULT_CONTACT_SETTINGS,
  normalizeContactSettings,
  type ContactSettings,
} from '@/lib/contact-settings'
import {
  DEFAULT_BANK_DETAILS,
  DEFAULT_COURSE_BANK_DETAILS,
  normalizeBankDetails,
  normalizeShopBankDetails,
  type BankDetails,
} from '@/lib/bank-details'
import {
  DEFAULT_COURSE_CATALOGUE_CONTENT,
  normalizeCourseCatalogueContent,
  type CourseCatalogueContent,
} from '@/lib/course-catalogue-content'
import { normalizeMediaUrl } from '@/lib/media-url'
import { slugify } from '@/utils/slug'

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

export interface WebsiteVideos {
  homeHeroVideoUrl: string
  homeHeroDemoUrl: string
  readingSuccessVideoUrl: string
  trainingsHeroVideoUrl: string
  trainingsOnsiteVideoUrl: string
}

export interface ContentImage {
  src: string
  alt: string
  caption?: string
}

export interface TrainerProfileLink {
  label: string
  href: string
  description?: string
}

export interface TrainerProfileAttachment {
  articleSlugs: string[]
  relatedLinks: TrainerProfileLink[]
  galleryImages: ContentImage[]
  includeAutoArticles: boolean
  includeAutoGallery: boolean
}

export type TrainerProfileAttachments = Record<string, TrainerProfileAttachment>

export interface AboutCard {
  title: string
  description?: string
  items?: string[]
}

export interface AboutPageContent {
  hero: {
    title: string
    subtitle: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
    image?: ContentImage | null
  }
  overview: {
    title: string
    paragraphs: string[]
  }
  mission: string
  vision: string
  whatWeDo: AboutCard[]
  whyChoose: string[]
  jollyNotice: {
    title: string
    subtitle: string
    paragraphs: string[]
    notice: string[]
  }
  services: string[]
  showLearningPath?: boolean
  learningPath: AboutCard[]
  milestones: { year: string; title: string; items: string[] }[]
  impact: { label: string; value: string }[]
  contact: { phones: string[]; emails: string[] }
  cta: { title: string; description: string; href: string; label: string }
  supportImages: ContentImage[]
  galleryImages: ContentImage[]
}

export interface ResearchProject {
  title: string
  period?: string
  summary: string[]
  schools?: string[]
  cities?: string[]
  links?: { label: string; href: string }[]
  images?: ContentImage[]
}

export interface ResearchPageContent {
  hero: { title: string; subtitle: string; image?: ContentImage | null }
  overview: string[]
  projects: ResearchProject[]
  supportImages: ContentImage[]
}

export interface HomepageGalleryContent {
  enabled: boolean
  title: string
  subtitle: string
  images: ContentImage[]
}

export interface PolicyContent {
  lastUpdated?: string
  intro: string[]
  sections: { title: string; body: string[] }[]
}

export interface FAQItem {
  q: string
  a: string[]
}

export const VORTEX_LEARNING_URL = 'https://officialvortexlear.wixsite.com/vortex-learning'
export const TRAINER_PROFILE_ATTACHMENTS_KEY = 'trainer_profile_attachments'

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: '1', content: 'Phonics Club transformed our school reading program. Jolly Phonics implementation was seamless.', author: 'Beaconhouse School', role: 'Lahore', rating: 5 },
  { id: '2', content: 'The training and materials from Phonics Club are exceptional. Our teachers are confident teaching synthetic phonics.', author: 'LGS Faculty', role: 'Lahore Grammar School', rating: 5 },
  { id: '3', content: 'Best phonics resources in Pakistan. Authorized dealer with full PCTB NOC support.', author: "Froebel's International", role: 'Islamabad', rating: 5 },
]

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', message: 'PCTB-approved Jolly Learning books are available through Phonics Club authorized channels', linkUrl: '/shop', linkText: 'Shop Now', active: true },
]

export const DEFAULT_FAQS: FAQItem[] = [
  {
    q: 'What does Phonics Club do?',
    a: [
      'Phonics Club Pvt. Ltd. promotes Synthetic Phonics for strong reading, writing, spelling, and communication skills.',
      'We support teachers, schools, parents, and students through certified training, consultancy, curriculum development, literacy assessments, books, classroom resources, and online learning.',
    ],
  },
  {
    q: 'What is Vortex Learning?',
    a: [
      'Vortex Learning is a company focused on providing students with different courses and online classes all over the world.',
      'Phonics Club highlights Vortex Learning as an online education partner for students and educators who need flexible learning support.',
    ],
  },
  {
    q: 'Which course should I choose first?',
    a: [
      'For teachers new to Synthetic Phonics, begin with a Jolly Phonics or introductory teacher training course. For schools, start with a literacy audit or teacher training pathway. For parents, choose a course or workshop that matches your child age and reading stage.',
      'If you are unsure, contact us and share your goal, student age group, and whether you prefer online or in-house training.',
    ],
  },
  {
    q: 'What is the classroom course cancellation policy?',
    a: [
      'By completing registration for a classroom or in-house course and making full or installment payment, you agree to the course terms and conditions.',
      'Any classroom course cancelled after registration carries a 30% admin fee, which is not refunded. The remaining deposit may be refunded if cancellation is requested at least 15 working days before the course starting date.',
      'You are not eligible for a refund if cancellation is requested less than 15 working days before the course starting date.',
      'If Phonics Club cancels a course because the minimum number of delegates is not reached, or because of an unforeseen circumstance affecting a safe training environment, management will arrange an alternative course date or offer a 70% refund of the fee paid.',
      'Once a course has been redeemed, login details have been issued, course outlines have been arranged, or live/online training access has started, refunds cannot be granted. Eligible refunds are processed within 30 days. Posted study material must be returned before refund processing.',
      'Refund requests can be sent to info@phonicsclub.com.',
    ],
  },
  {
    q: 'Can I postpone a classroom course?',
    a: [
      'Yes. Classroom or in-house course postponement requests must be made at least 5 working days before the course starting date, and there is no postponement cost.',
      'Requests made less than 5 working days before the course starting date cannot be postponed.',
    ],
  },
  {
    q: 'What payment options are available?',
    a: [
      'Cash on Delivery is available for eligible shop orders.',
      `Course Bank Transfer: ${DEFAULT_COURSE_BANK_DETAILS.bankName}, Account Title: ${DEFAULT_COURSE_BANK_DETAILS.accountTitle}, A/C No: ${DEFAULT_COURSE_BANK_DETAILS.accountNumber}.`,
      `Course IBAN: ${DEFAULT_COURSE_BANK_DETAILS.iban}.`,
      `Having issue with payment? Contact us at ${COMPANY.phoneDisplay}.`,
    ],
  },
  {
    q: 'How can I order books or classroom resources?',
    a: [
      'You can order from the website shop, by email, by phone, or through WhatsApp. Website orders are placed through /shop and checkout.',
      `For help, contact ${COMPANY.email}, ${COMPANY.adminEmail}, or WhatsApp ${COMPANY.phoneDisplay}.`,
    ],
  },
  {
    q: 'Are Jolly Learning books PCTB approved?',
    a: [
      'Almost all approved Jolly Learning books are available with the required PCTB approvals, with little or no editing.',
      'School administrations, distributors, and retailers should buy only through authorized Phonics Club channels. Customers with previous stock purchased from Phonics Club should claim official QR Code verification stickers where applicable.',
    ],
  },
  {
    q: 'How can I cancel a product order?',
    a: [
      'A product order can be cancelled only within 10 minutes of placement and only before it has moved into payment confirmation, processing, shipping, or delivery.',
      'Once the edit window closes, contact Phonics Club support for any urgent correction requests.',
    ],
  },
  {
    q: 'What is your returns or exchange policy?',
    a: [
      'Returns or exchanges are considered only if the disputed item was not on your order or the item had a production imperfection or verified transit damage.',
      'Report issues within 24 to 48 hours of receipt and keep original packaging. Clear photos of the item, package, and shipping label may be required.',
    ],
  },
  {
    q: 'Can schools request consultancy or custom training?',
    a: [
      'Yes. Schools can request literacy audits, teacher mentoring, curriculum planning, reading assessments, English language improvement programs, and custom professional development.',
      'Contact us with your school name, city, teacher count, grade levels, and the support required.',
    ],
  },
  {
    q: 'Can I register for trainings or webinars online?',
    a: [
      'Yes. Published trainings and webinars appear on the Trainings page. Choose the event, submit your registration details, and wait for confirmation or payment instructions where required.',
      'Your registered trainings and webinars also appear in your dashboard after they are linked to your account or email address.',
    ],
  },
  {
    q: 'Where will my training or webinar certificate appear?',
    a: [
      'If a certificate is issued for a training or webinar, it may be uploaded to your dashboard, emailed to you, or both depending on the event process.',
      'If you cannot see an expected certificate, contact support with your registration name, email address, event title, and date.',
    ],
  },
  {
    q: 'How do course certificates work?',
    a: [
      'Course certificates are available only for courses that explicitly include a certificate pathway.',
      'Certificate eligibility may depend on lesson completion, quiz requirements, assignment review, learning time, active enrollment, and instructor or admin approval.',
    ],
  },
  {
    q: 'Why is a course not showing as completed?',
    a: [
      'Some courses require more than opening a lesson. Completion can depend on required lessons, quizzes, assignments, approved offline activity, or active enrollment status.',
      'Open your dashboard or course workspace to review the exact progress and certificate requirements for that course.',
    ],
  },
  {
    q: 'Can I update my account details or password?',
    a: [
      'Yes. Signed-in users can open Profile Settings from the dashboard to update their display name, username, and password.',
      'Admins cannot see customer passwords. If you forget your password, use the secure password reset email flow.',
    ],
  },
  {
    q: 'How do member IDs and coupons work?',
    a: [
      'Coupons and member IDs are validated during checkout and discounts are calculated by the website, not by manually changing invoice totals.',
      'If a member ID includes a shipping-fee benefit, the invoice preview will show the shipping discount before the order is placed.',
    ],
  },
  {
    q: 'What if the AI assistant cannot answer my question?',
    a: [
      'The assistant is designed to guide you through courses, products, training, payments, orders, certificates, research, Vortex Learning, and support routes.',
      `For complex or account-specific questions, it will guide you to contact Phonics Club at ${COMPANY.phoneDisplay}, ${COMPANY.phoneAltDisplay}, ${COMPANY.email}, or ${COMPANY.adminEmail}.`,
    ],
  },
]

const DEFAULT_SOCIAL_REELS: SocialReel[] = [
  { id: '1', thumbnail: '/images/gallery/pilott.jpeg', videoUrl: '', title: 'Pilot project classroom' },
  { id: '2', thumbnail: '', videoUrl: '/images/gallery/vowels.mp4', title: 'Vowel sounds practice' },
  { id: '3', thumbnail: '/images/gallery/pilottttt.jpeg', videoUrl: '', title: 'Pilot project learning' },
  { id: '4', thumbnail: '/images/gallery/pilottttt1.jpeg', videoUrl: '', title: 'Teacher workshop' },
  { id: '5', thumbnail: '', videoUrl: COMPANY.social.instagram, title: 'Student progress' },
  { id: '6', thumbnail: '', videoUrl: '/images/gallery/pilothunza.mp4', title: 'Phonics Club community' },
]

const JOLLY_NOC_IMPORTANT_NOTICE = [
  'School administrations, distributors, and retailers are strongly advised to purchase only through authorized channels.',
  'Some unauthorized editions have been modified to comply with PCTB requirements and may differ from approved versions.',
  'Phonics Club cannot guarantee the authenticity or quality of books purchased through unauthorized dealers.',
  'Customers who purchased books from Phonics Club before the issuance of NOCs should claim their official QR Code verification stickers.',
  'Approved book lists are also available on the PCTB website.',
]

const SCHOOL_LOGO_PATHS: Record<string, string> = {
  tns: '/images/logos/tns.jpg',
  froebels: '/images/logos/froebels.jpg',
  starfish: '/images/logos/starfish.jpg',
  quixotic: '/images/logos/quixotic.jpg',
  lgs: '/images/logos/lgs.jpg',
  beaconhouse: '/images/logos/beaconhouse.png',
  rwis: '/images/logos/RWIS.jpg',
  dynamic: '/images/logos/dynamic international.png',
  'dynamic-international': '/images/logos/dynamic international.png',
  'dynamic-international-school': '/images/logos/dynamic international.png',
  beginnings: '/images/logos/beginnings international school.jpg',
  'beginning-international': '/images/logos/beginnings international school.jpg',
  'beginning-international-school': '/images/logos/beginnings international school.jpg',
  'beginning-international-schools': '/images/logos/beginnings international school.jpg',
  'beginnings-international': '/images/logos/beginnings international school.jpg',
  'beginnings-international-school': '/images/logos/beginnings international school.jpg',
  'beginnings-international-schools': '/images/logos/beginnings international school.jpg',
  elysian: '/images/logos/elysian schhol.jpg',
  'elysian-school': '/images/logos/elysian schhol.jpg',
  iiui: '/images/logos/iiui schools.jpg',
  'iiui-schools': '/images/logos/iiui schools.jpg',
  'iiui-school-college': '/images/logos/iiui schools.jpg',
  'iiui-school-and-college': '/images/logos/iiui schools.jpg',
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
  { id: 'dynamic', name: 'Dynamic International School', imageUrl: SCHOOL_LOGO_PATHS.dynamic, sortOrder: 8 },
  { id: 'academus', name: 'Academus', imageUrl: SCHOOL_LOGO_PATHS.academus, sortOrder: 9 },
  { id: 'alda', name: 'ALDA', imageUrl: SCHOOL_LOGO_PATHS.alda, sortOrder: 10 },
  { id: 'horizon', name: 'Horizon School System', imageUrl: SCHOOL_LOGO_PATHS.horizon, sortOrder: 11 },
  { id: 'aksp', name: 'AKSP', imageUrl: SCHOOL_LOGO_PATHS.aksp, sortOrder: 12 },
  { id: 'akrsp', name: 'AKRSP', imageUrl: SCHOOL_LOGO_PATHS.akrsp, sortOrder: 13 },
  { id: 'beginnings', name: 'Beginnings International Schools', imageUrl: SCHOOL_LOGO_PATHS.beginnings, sortOrder: 14 },
  { id: 'elysian', name: 'Elysian', imageUrl: SCHOOL_LOGO_PATHS.elysian, sortOrder: 15 },
  { id: 'iiui', name: 'IIUI School & College', imageUrl: SCHOOL_LOGO_PATHS.iiui, sortOrder: 16 },
]

const DEFAULT_TRAINERS = [
  {
    id: 'trainer-fatima-tuz-zahra',
    name: 'Dr. Fatima Tuz Zahra',
    slug: 'fatima-tuz-zahra',
    title: 'Certified Jolly Phonics Trainer and Literacy Consultant',
    bio: 'Dr. Fatima Tuz Zahra leads Phonics Club and supports schools, teachers, parents, and learners through lively Jolly Phonics and Jolly Literacy training.',
    image_url: '/images/trainers/dr%20fatima%20tuz%20zahra.jpg',
    achievements: ['Founder and lead trainer at Phonics Club', 'Worked with government, foundations, publishers, and schools', 'Designed curricula and training for schools across budget levels'],
    credentials: ['Certified Jolly Phonics trainer', 'Literacy consultant', 'Synthetic Phonics implementation specialist'],
    specialties: ['Jolly Phonics', 'Jolly Literacy Training', 'School implementation', 'Teacher training'],
    profile_details:
      'City: Lahore\nPhone: 0308 4432015\nEmail: fatematuzzehra@gmail.com\n\nFatima is a trainer and literacy consultant currently running Phonics Club in Pakistan, where children, parents, and teachers benefit from her lively training. She provides Jolly Phonics and Jolly Literacy training along with concept progression, school consultancy, and practical classroom support.\n\nShe works closely with local education foundations, authorities, and publishers, and has piloted Jolly Phonics in low-cost public and private schools. She is acknowledged for her sessions on teaching with Jolly Learning products in Pakistan and abroad.',
    sort_order: 1,
    published: true,
  },
  {
    id: 'trainer-anum-zehra-zaidi',
    name: 'Anum Zehra Zaidi',
    slug: 'anum-zehra-zaidi',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Anum Zehra Zaidi is a seasoned trainer with deep classroom experience and a strong understanding of Synthetic Phonics theory.',
    image_url: null,
    achievements: ['Trained hundreds of teachers across Pakistan', 'Worked with private, government, and non-profit institutions', 'Collaborated with global Jolly Phonics trainers'],
    credentials: ['Certified Jolly Phonics trainer', 'Classroom teaching and teacher training specialist'],
    specialties: ['Classroom implementation', 'Teacher training', 'Synthetic Phonics theory and practice'],
    profile_details:
      'City: Karachi\nPhone: 92 (336) 2093055\nEmail: zaidi.anumzehra@gmail.com\n\nAnum Zehra is a passionate and seasoned trainer of Jolly Phonics with thorough classroom teaching experience. Her diverse training work across Pakistan enables her to support teachers from different academic, ethnic, and geographical backgrounds. She integrates real classroom experience with a strong understanding of phonics concepts.',
    sort_order: 2,
    published: true,
  },
  {
    id: 'trainer-zaibunnissa-sadozai',
    name: 'Zaibunnissa Sadozai',
    slug: 'zaibunnissa-sadozai',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Zaibunnissa Sadozai brings primary teaching, leadership, and Jolly Phonics implementation experience from Pakistan and the USA.',
    image_url: null,
    achievements: ['Primary teacher and school leader', 'Lead teacher experience in Virginia, USA', 'Involved in AFAQ adoption work for Jolly Phonics'],
    credentials: ['Masters in International Relations', 'Certified Jolly Phonics trainer'],
    specialties: ['Primary literacy', 'School leadership', 'Jolly Phonics adoption support'],
    profile_details:
      'City: Karachi\nPhone: 03362451379\nEmail: zaibapk@yahoo.com\n\nZaibunnissa completed her Masters in International Relations from the University of Peshawar and began her career as a primary teacher. She served in prestigious schools in Pakistan and also worked in Virginia, USA as a lead preschool teacher. After using Jolly Phonics, she saw strong development in children reading and writing, especially for learners with weak visual skills.',
    sort_order: 3,
    published: true,
  },
  {
    id: 'trainer-tahira-sheikh',
    name: 'Tahira Sheikh',
    slug: 'tahira-sheikh',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Tahira Sheikh is an Islamabad-based trainer known for private school implementation and large-scale government training work.',
    image_url: null,
    achievements: ['Secured and led Jolly Phonics work with KPK government partners', 'Supported monitoring for large-scale implementation', 'Conducted workshops for schools and parents in Islamabad'],
    credentials: ['MBA in Management from the UK', 'Certified Jolly Phonics trainer'],
    specialties: ['Government implementation', 'Jolly Phonics and literacy monitoring', 'School mentoring'],
    profile_details:
      'City: Islamabad\nPhone: +92 300 5275097\nEmail: tee.irfan@gmail.com\n\nTahira is originally from London, UK, and now lives in Islamabad. She moved from management into literacy education after seeing the need for stronger reading and writing outcomes. She first used Jolly Phonics in 2004 and later became a private tutor focused on Jolly Phonics and Jolly Literacy. She has helped schools implement the programme and has supervised teachers using it.',
    sort_order: 4,
    published: true,
  },
  {
    id: 'trainer-tamkanat-zafar',
    name: 'Tamkanat Zafar',
    slug: 'tamkanat-zafar',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Tamkanat Zafar is an artist, English language instructor, trainer, curriculum coordinator, and education consultant.',
    image_url: null,
    achievements: ['More than two decades in education', 'Taught preschoolers, secondary students, and adults', 'Served as trainer, curriculum coordinator, and consultant'],
    credentials: ['Certified Jolly Phonics trainer', 'English language and art instructor'],
    specialties: ['Creative literacy instruction', 'Teacher training', 'Curriculum coordination'],
    profile_details:
      'City: Islamabad\nPhone: 0321-5234905\nEmail: tamkanat.zafar@gmail.com\n\nTamkanat discovered Jolly Phonics in 2005 and was inspired by the outcomes in reading and writing. She has used the method with many age groups and is passionate about training teachers through fun, practical, and effective methodology.',
    sort_order: 5,
    published: true,
  },
  {
    id: 'trainer-fatemah-imran',
    name: 'Fatemah Imran',
    slug: 'fatemah-imran',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Fatemah Imran is an early years teacher and trainer who supports Jolly Phonics and Jolly Literacy implementation from early years to Grade 3.',
    image_url: null,
    achievements: ['Founded EYRIE preschool and daycare in Islamabad', 'Implemented Jolly Phonics in nurseries, reception, and elementary classes', 'Supports teachers, assistants, coordinators, and parents'],
    credentials: ['Certified Jolly Phonics trainer', 'Early years educator'],
    specialties: ['Early years literacy', 'Play-based learning', 'Jolly Phonics setup and implementation'],
    profile_details:
      'City: Islamabad\nPhone: +92 3335159565\nEmail: eyrie.isl@gmail.com\n\nFatemah has taught in private preschools for more than ten years. She first encountered Jolly Phonics in 2009 and was inspired by its structure and enjoyable approach to reading. In 2018 she launched EYRIE, a play-based preschool and daycare in Islamabad, using Jolly Phonics to support children literacy development.',
    sort_order: 6,
    published: true,
  },
  {
    id: 'trainer-erum-tehreem',
    name: 'Erum Tehreem',
    slug: 'erum-tehreem',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Erum Tehreem is a trainer and section head focused on early years education and practical Jolly Phonics implementation.',
    image_url: null,
    achievements: ['More than 11 years of teaching and management experience', 'Implemented Jolly Phonics curriculum at Margalla Grammar School Wah Cantt', 'Trained more than 100 teachers'],
    credentials: ['Certified Jolly Phonics trainer', 'Business and Economics background'],
    specialties: ['Early years education', 'Parent orientation', 'Teacher training'],
    profile_details:
      'City: Islamabad\nPhone: +92 334 9192929\nEmail: erum.tehreem4@gmail.com\n\nErum Tehreem has taught at several prestigious institutions and worked as a lead teacher at Froebel International School. She now works as a section head at the kindergarten branch of a private institute. Since discovering Jolly Phonics in 2013, she has seen strong changes in student reading and writing and continues to train teachers and guide parents.',
    sort_order: 7,
    published: true,
  },
  {
    id: 'trainer-sadaf-asif',
    name: 'Sadaf Asif',
    slug: 'sadaf-asif',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Sadaf Asif is an early years educator, school leader, trainer, and the first Jolly Phonics YouTuber in Pakistan.',
    image_url: null,
    achievements: ['Runs an early years school and Jolly Phonics training centre in Islamabad', 'First Jolly Phonics YouTuber in Pakistan', 'Worked on AFAQ and KPK implementation projects'],
    credentials: ['Certified Jolly Phonics trainer', 'Early years educator'],
    specialties: ['Early years teaching', 'Teacher and parent training', 'Digital phonics resources'],
    profile_details:
      'City: Islamabad\nPhone: 03445037461\nEmail: sadaf_asif2000@hotmail.com\n\nSadaf has over 10 years of early years teaching experience across Islamabad and Wah Cantt. She works with playgroup, nursery, and KG children and is passionate about creating engaging activities. She has conducted staff, parent, and teacher training sessions across major cities and has supported Jolly Phonics implementation projects in Punjab and KPK.',
    sort_order: 8,
    published: true,
  },
  {
    id: 'trainer-ambreen-owais',
    name: 'Ambreen Owais',
    slug: 'ambreen-owais',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Ambreen Owais is a teacher and trainer who supports teachers and parents through her Phonics World work.',
    image_url: null,
    achievements: ['15 years of teaching experience', 'Runs Phonics World', 'Supports teachers and parents with Jolly Phonics understanding'],
    credentials: ['Certified Jolly Phonics trainer', 'Experienced classroom teacher'],
    specialties: ['Reading support', 'Teacher training', 'Parent guidance'],
    profile_details:
      'City: Lahore\nPhone: +92 3009500828\nEmail: ambowais@gmail.com\n\nAmbreen has taught for 15 years in a renowned institution. She came across Jolly Phonics in 2015 and found it valuable for children who face difficulty in reading and writing. Through Phonics World, she aims to train teachers and parents so more children can benefit from the programme.',
    sort_order: 9,
    published: true,
  },
  {
    id: 'trainer-sonia-saleem',
    name: 'Sonia Saleem',
    slug: 'sonia-saleem',
    title: 'Certified Jolly Phonics Trainer',
    bio: 'Sonia Saleem is an experienced teacher and certified trainer with international school experience in Jeddah, Saudi Arabia.',
    image_url: null,
    achievements: ['Trained teachers after achieving strong classroom results with Jolly Phonics', 'Works as Head Teacher Trainer for MEET, KSA', 'Presented in KSAALT'],
    credentials: ['Certified Jolly Phonics trainer', 'Graduate Diploma in TESOL'],
    specialties: ['International school literacy', 'Teacher training', 'TESOL-informed instruction'],
    profile_details:
      'City: Lahore\nEmail: miss.sonia2011@gmail.com\n\nSonia has used Jolly Phonics successfully in international schools in Jeddah, Saudi Arabia. The results led her to train other teachers so they could teach effectively. She has completed a Graduate Diploma in TESOL and is eager to support teachers and children in schools across Pakistan.',
    sort_order: 10,
    published: true,
  },
]

const DEFAULT_VORTEX: VortexLearning = {
  title: 'Vortex Learning',
  description:
    'Vortex Learning is a project of Phonics Club focused on providing students with different courses and online classes all over the world.',
  websiteUrl: VORTEX_LEARNING_URL,
  courses: [
    { title: 'Online Classes', description: 'Structured online learning support for students across regions', href: '/courses' },
    { title: 'Professional Development', description: 'Courses and development pathways for educators', href: '/courses?category=teacher-courses' },
    { title: 'Student Programs', description: 'Flexible learning programs for students around the world', href: '/courses' },
  ],
}

const DEFAULT_HERO_VIDEO: HeroVideo = {
  videoUrl: 'https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa',
  demoButtonUrl: 'https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf',
}

export const DEFAULT_WEBSITE_VIDEOS: WebsiteVideos = {
  homeHeroVideoUrl: DEFAULT_HERO_VIDEO.videoUrl,
  homeHeroDemoUrl: DEFAULT_HERO_VIDEO.demoButtonUrl ?? DEFAULT_HERO_VIDEO.videoUrl,
  readingSuccessVideoUrl: '/images/schools/Watch the Transformation!.mp4',
  trainingsHeroVideoUrl: '/images/schools/cover video jolly experience day.mp4',
  trainingsOnsiteVideoUrl: '/images/schools/trainingclip.mp4',
}

const DEFAULT_ABOUT_GALLERY_IMAGES: ContentImage[] = [
  { src: '/images/gallery/banner.jpg', alt: 'Phonics Club training banner and classroom display' },
  { src: '/images/gallery/bb.jpg', alt: 'Phonics Club literacy activity display' },
  { src: '/images/gallery/bk.jpg', alt: 'Phonics Club books and literacy learning materials' },
  { src: '/images/gallery/gall.jpg', alt: 'Phonics Club teacher training session' },
  { src: '/images/gallery/gallelryry.jpg', alt: 'Phonics Club classroom training participants' },
  { src: '/images/gallery/gallery.jpg', alt: 'Phonics Club learning workshop gallery image' },
  { src: '/images/gallery/galleryyy.jpg', alt: 'Phonics Club literacy workshop gallery image' },
  { src: '/images/gallery/galll.jpg', alt: 'Phonics Club professional development gallery image' },
  { src: '/images/gallery/gallleyryy.jpg', alt: 'Phonics Club training and school support gallery image' },
  { src: '/images/gallery/newsssgall.jpg', alt: 'Phonics Club news and teacher training gallery image' },
  { src: '/images/gallery/pic.jpg', alt: 'Phonics Club classroom literacy support' },
  { src: '/images/gallery/pic1.jpg', alt: 'Phonics Club school literacy activity' },
  { src: '/images/gallery/pilot.jpg', alt: 'Phonics Club pilot project classroom moment' },
  { src: '/images/gallery/pilott.jpeg', alt: 'Phonics Club pilot project training image' },
  { src: '/images/gallery/pilottttt.jpeg', alt: 'Phonics Club pilot project literacy support' },
  { src: '/images/gallery/pilottttt1.jpeg', alt: 'Phonics Club pilot project classroom support' },
  { src: '/images/gallery/pl.jpg', alt: 'Phonics Club literacy learning gallery image' },
  { src: '/images/gallery/pla.jpg', alt: 'Phonics Club classroom phonics activity' },
  { src: '/images/gallery/play.jpg', alt: 'Phonics Club play based phonics learning activity' },
]

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  hero: {
    title: 'Empowering Literacy Through Synthetic Phonics',
    subtitle:
      'Phonics Club Pvt. Ltd. helps teachers, schools, and parents build confident readers and writers through internationally recognized Synthetic Phonics methodologies, professional training, curriculum development, and educational consultancy.',
    primaryCta: { label: 'Explore Courses', href: '/courses' },
    secondaryCta: { label: 'Meet Our Trainers', href: '/certified-trainers' },
    image: {
      src: '/images/gallery/header.jpg',
      alt: 'Phonics Club classroom learning and teacher training',
      caption: 'Phonics Club literacy training and classroom support.',
    },
  },
  overview: {
    title: 'About Phonics Club',
    paragraphs: [
      'Phonics Club Pvt. Ltd. is a registered organization dedicated to advancing literacy through the Synthetic Phonics approach. As the Official Jolly Learning Distributor in Pakistan, Phonics Club provides authentic Jolly Learning resources, professional development, and literacy solutions that empower teachers to help children become confident, independent readers, writers, and spellers.',
      'Since its establishment in 2015, Phonics Club has worked with schools, educators, and institutions across Pakistan and internationally to strengthen English language education through evidence-based literacy practices.',
      'The organization offers professional teacher training, educational consultancy, curriculum development, school support, language assessments, internationally aligned literacy programs, and access to official Jolly Learning teaching materials. Through expert guidance, quality resources, and ongoing support, Phonics Club helps educators create engaging, effective, and successful literacy classrooms.',
    ],
  },
  mission:
    'To transform literacy education by empowering educators with internationally recognized Synthetic Phonics methodologies, ensuring every child develops strong reading, writing, spelling, and communication skills.',
  vision:
    'To become the leading literacy training organization in Pakistan and beyond, creating confident teachers and lifelong readers through innovative, research-based educational solutions.',
  whatWeDo: [
    {
      title: 'Teacher Training',
      description: 'Professional certification courses in Jolly Phonics, Jolly Grammar, Jolly Literacy, Early Years Literacy, and Reading Intervention.',
      items: ['Jolly Phonics', 'Jolly Grammar', 'Jolly Literacy', 'Early Years Literacy', 'Reading Intervention'],
    },
    {
      title: 'Educational Consultancy',
      description: 'School support for literacy audits, teacher mentoring, curriculum planning, reading assessments, and English language improvement programs.',
      items: ['School literacy audits', 'Teacher mentoring', 'Curriculum planning', 'Reading assessments', 'English language improvement programs'],
    },
    {
      title: 'Curriculum Development',
      description: 'Development of literacy programs, teacher guides, student workbooks, assessment frameworks, and reading progression plans.',
      items: ['School literacy programs', 'Teacher guides', 'Student workbooks', 'Assessment frameworks', 'Reading progression plans'],
    },
    {
      title: 'Professional Development',
      description: 'Continuous support through workshops, webinars, coaching, school visits, and online learning.',
      items: ['Workshops', 'Webinars', 'Coaching', 'School visits', 'Online learning'],
    },
    {
      title: 'Learning Resources',
      description: 'Access to books, readers, classroom materials, teaching resources, and digital content.',
      items: ['Books', 'Readers', 'Classroom materials', 'Teaching resources', 'Digital content'],
    },
    {
      title: 'Parent Support',
      description: "Guidance, workshops, and structured learning materials that help parents develop children's literacy at home.",
    },
  ],
  whyChoose: [
    'Internationally trained instructors',
    'Thousands of teachers trained',
    'Curriculum development expertise',
    'School consultancy services',
    'National and international workshops',
    'Research-driven teaching practices',
    'Certified training programs',
    'Ongoing professional support',
  ],
  jollyNotice: {
    title: 'Jolly Learning Books and Official NOCs',
    subtitle: 'Official Distributor and Authorized Educational Partner',
    paragraphs: [
      'As the Official Jolly Learning Distributor in Pakistan, Phonics Club provides authentic Jolly Learning books with all required PCTB approvals and NOCs already secured, ensuring educators have access to fully approved and internationally recognized literacy resources.',
    ],
    notice: JOLLY_NOC_IMPORTANT_NOTICE,
  },
  services: [
    'Teacher Training',
    'School Consultancy',
    'Curriculum Development',
    'Literacy Assessments',
    'Certified Trainers',
    'Reading Intervention',
    'Professional Workshops',
    'School Partnerships',
  ],
  showLearningPath: false,
  learningPath: [
    { title: 'Playgroup (Age 3+)', items: ['Fun Phonics Pack 1', 'Letters and Sounds Strip', 'Optional Fun Phonics Pack 2', 'Picture Stories'] },
    { title: 'Pre-K (Age 4+)', items: ['Jolly Phonics Pupil Book 1', 'Orange Level Readers', 'Little Word Books'] },
    { title: 'Kindergarten (Age 5+)', items: ['Jolly Phonics Pupil Books 2-3', 'Level 1 Readers', 'Level 2 Readers'] },
    { title: 'Grade 1-6', items: ['Jolly Literacy', 'Jolly Grammar', 'Levelled Reading Programs', 'Progressive Literacy Resources'] },
  ],
  milestones: [
    {
      year: '2015',
      title: 'Foundation',
      items: [
        'Established Phonics Club Pvt. Ltd.',
        "Pakistan's first dedicated Synthetic Phonics institution",
        'Learning centres for children with reading difficulties',
        'Teacher and parent professional development',
        'School membership programs',
        'Curriculum development projects',
        'International e-learning initiatives',
        'Learner support through hotline, WhatsApp, webinars, and school visits',
        'Adult Literacy Programme and Let Girls Learn Programme',
        'Research initiatives launched in Lahore and Karachi',
      ],
    },
    {
      year: '2016',
      title: 'National Pilot Projects',
      items: ['Pioneered Synthetic Phonics pilot studies in Pakistan', 'Collaboration with United States partners', 'Punjab Education Foundation collaboration', 'ITACEC collaboration', 'Accredited by Jolly Learning UK'],
    },
    {
      year: '2017',
      title: 'Education Reform',
      items: ['Edited Punjab Textbook Board English textbooks', 'Authored and reviewed PTB Teacher Guide Books', 'Worked with McKinsey on education reforms', 'Worked with Adam Smith International', 'Designed Urdu curriculum', 'Trained over 10,000 teachers and students nationally and internationally'],
    },
    {
      year: '2018',
      title: 'Expansion',
      items: ["Translated Jolly Phonics Teacher's Book into Urdu", 'Translated Parent and Teacher Guide into Urdu', 'KPK teacher training project', 'Developed English learning smartphone application', 'Trained more than 12,000 teachers and students'],
    },
    {
      year: '2019',
      title: 'International Trainings',
      items: ['International trainer Coral George conducted trainings in Lahore, Islamabad, and Karachi', "Locations included Virtual University Campus, Froebel's International School, and Teacher Resource Centre Karachi", 'Participation in KPK literacy project'],
    },
    {
      year: '2020',
      title: 'Global Outreach',
      items: ['International Teaching through Jolly Phonics programme by Yvonne Dalorto', 'Partnership with Global Montessori Coaching Institute', 'Free literacy training and resources provided to over 5,000 children'],
    },
    {
      year: '2021',
      title: 'Online Growth',
      items: ['International online training events', 'Two-month Jolly Phonics Intensive Course', 'Two-month Jolly Grammar Intensive Course', 'Research publication', 'Research on language change in bilinguals'],
    },
    { year: '2022', title: 'Future Milestones', items: ['Reserved for future milestones.'] },
    { year: '2023', title: 'Future Milestones', items: ['Reserved for future milestones.'] },
    {
      year: '2024',
      title: 'Major National and International Training Activities',
      items: ['August and September on-site trainings at Soar STEM School and Virtual University Lahore', 'October to December international training series with Coral George', "Lahore trainings at TNS Beaconhouse DHA, Froebel's International School Lahore, and TNS Beaconhouse Gulberg", "Islamabad training at Froebel's International School Islamabad", 'Karachi training events including Mrs. Mohiuddin Montessori'],
    },
    {
      year: '2025',
      title: 'Pilot Projects and Landmark Literacy Events',
      items: [
        'AKRSP pilot-project training activity expanded to Gilgit and Skardu',
        'Gujranwala Pilot Project professional teacher training strengthened classroom implementation in September 2025',
        'Chitral Pilot Project training extended professional literacy development during Fall 2025',
        'Pilot Project Training Workshop conducted at NSCOE, Children Library Complex Lahore',
        'Professional training programmes held at Allaudin Academy and other Lahore partner schools',
        'Jolly Morning Day at NSCOE celebrated multisensory literacy learning and Jolly Phonics practice',
        'Christopher Jolly visited Chitral for a special Teaching Jolly Phonics session',
        'Christopher Jolly in Lahore marked a landmark literacy event at Children Library Complex',
        'Jolly Experience Day in Islamabad brought together Christopher Jolly and experienced Jolly Phonics trainers',
      ],
    },
    {
      year: '2026',
      title: 'Workshops, Webinars and Continued Outreach',
      items: [
        'Jolly Phonics Training Workshops conducted in Gilgit and Hunza',
        'Lahore Jolly Phonics Training Workshop held at Unique School, Township Branch, in collaboration with Starfish Pakistan School',
        'Pilot Project Refresher Training supported pilot-project schools at NSCOE Lahore',
        'Gujranwala Pilot Project refresher training reinforced classroom implementation in mid-January 2026',
        'Free Jolly Grammar and Jolly English webinar offered professional learning for teachers, parents and educators',
        'International webinar on helping children climb out of the Failure Pit supported collaborative professional discussion',
        'Professional training at Bright Vision School Lahore and Al-Fatah School Chakwal extended school-based teacher development',
        'Event, training, research and pilot-project stories were organized into the website blog archive for public access',
      ],
    },
  ],
  impact: [
    { label: 'Years of Service', value: '10+' },
    { label: 'Teachers and Students Trained', value: '12,000+' },
    { label: 'Schools Supported', value: '200+' },
    { label: 'Training Programs', value: 'National and International' },
    { label: 'Professional Support', value: 'Online and On-site' },
  ],
  contact: {
    phones: [COMPANY.phoneDisplay],
    emails: ['info@phonicsclub.com', 'support@phonicsclub.com'],
  },
  cta: {
    title: 'Ready to Transform Literacy Education?',
    description:
      'Join thousands of educators who trust Phonics Club for world-class literacy training, internationally recognized teaching methodologies, and continuous professional development.',
    href: '/courses',
    label: 'Explore Courses',
  },
  supportImages: [
    { src: '/images/schools/partners-strip-1.png', alt: 'Phonics Club school and training partners', caption: 'School partnerships and national training activity' },
  ],
  galleryImages: DEFAULT_ABOUT_GALLERY_IMAGES,
}

export const DEFAULT_RESEARCH_PAGE: ResearchPageContent = {
  hero: {
    title: 'Research and Pilot Study Projects',
    subtitle:
      'Phonics Club documents classroom evidence, pilot studies, and implementation projects that improve English literacy outcomes through Synthetic Phonics.',
    image: {
      src: '/images/gallery/researchinpakistan.jpg',
      alt: 'Phonics Club research and literacy implementation in Pakistan',
      caption: 'Research, pilots and implementation evidence from Phonics Club learning projects.',
    },
  },
  overview: [
    'Our research activity focuses on practical classroom implementation: training teachers, observing learners, improving methodology, and using evidence to guide future literacy work.',
  ],
  projects: [
    {
      title: 'Pilot Study Project 1: Jolly Phonics Estate Schools Trial',
      period: 'One-year trial',
      summary: [
        'Phonics Club, in collaboration with Jolly Learning Limited, started a project aimed at improving the level of English in Pakistan. Jolly Phonics was trialed for one year in six estate schools with materials and training for learning to read and write in English.',
        'The project was initiated to demonstrate that a change of methodology can bring a significant difference in the lives of children. It highlighted the need to redirect teaching strategies in pre-primary and primary schools, and to continue phonics after kindergarten into grade one and beyond.',
        'Teachers received training and personal consultancy from certified Jolly Learning trainer Ms. Fatima during the first year of introducing Jolly Phonics. The schools implemented Jolly Phonics in grade 1 under close instruction and reported that the training was highly beneficial for teachers and students.',
      ],
      schools: ['Alrasheed Ideal School', 'Ahmad Grammar School', 'Mumtaz School of Education', 'English Grammar School', 'Faran Grammar School', 'Decent Public School'],
      links: [
        { label: 'Project orientation', href: 'https://web.facebook.com/punjabeducationfoundation.official/posts/887316214662770?_rdr' },
        { label: 'Project launched', href: 'https://punjabeducationfoundation.blogspot.com/2015/05/pilot-project-launched-to-develop.html' },
        { label: 'Training news', href: 'https://www.thenews.com.pk/print/42710-32-associate-professors-promoted' },
      ],
      images: [
        {
          src: '/images/gallery/1-4.jpg',
          alt: 'Children learning with Phonics Club pilot project materials',
          caption: 'Pilot project classroom learning support.',
        },
        {
          src: '/images/gallery/language-lab.jpg',
          alt: 'Language lab and literacy learning environment',
          caption: 'Language lab support for literacy development.',
        },
      ],
    },
    {
      title: 'Pilot Study Project 2: Literacy Standards and National Roll-out',
      summary: [
        'This project was initiated to raise literacy standards in Pakistan through trials and future national roll-out of the Jolly Phonics Program, a proven method of accelerated English language learning.',
        'The work emphasizes that all tiers of government and all segments of society must respond seriously before Pakistan can overcome literacy challenges and move toward a stronger educational future.',
        'According to the Annual Status of Education Report 2012 by ASER, many children in grade 3 were unable to read and write in English due to educational malpractice. If a child is unable to read and write at the age of 9, their confidence and responsiveness to learning can be deeply affected.',
      ],
      links: [
        { label: 'Lahore Times press release', href: 'https://www.lhrtimes.com/2016/04/15/groups-call-greater-use-jolly-phonics-solve-challenge-illiteracy/' },
        { label: 'The Nation press release', href: 'https://nation.com.pk/16-Apr-2016/an-easy-way-to-teach-english-to-kids' },
      ],
    },
    {
      title: 'Pilot Study Project 3: Multi-city Implementation',
      period: 'Ongoing from 2025 to 2026',
      summary: ['This ongoing project expands implementation across multiple cities and regions, with classroom research and literacy support continuing through 2025 and 2026.'],
      cities: ['Lahore', 'Chitral', 'Gujranwala', 'Skardu', 'Karachi'],
    },
  ],
  supportImages: [
    { src: '/images/gallery/pilot school.jpeg', alt: 'Phonics Club pilot school evidence and project images', caption: 'Pilot project Lahore training workshop.' },
    { src: '/images/gallery/pilot.jpg', alt: 'Phonics Club pilot study classroom project', caption: 'Pilot study and classroom implementation activity.' },
    { src: '/images/gallery/class.jpg', alt: 'Teacher-led phonics classroom session', caption: 'Training and classroom observation support.' },
    { src: '/images/gallery/pilotttttw.jpeg', alt: 'Pilot project evaluation team 2025-2026', caption: 'Pilot project Evaluation Team 2025-2026.' },
  ],
}

export const DEFAULT_HOMEPAGE_GALLERY: HomepageGalleryContent = {
  enabled: true,
  title: 'Learning Moments From Phonics Club',
  subtitle: 'A visual look at trainings, classrooms, materials and literacy work across the Phonics Club community.',
  images: [
    { src: '/images/gallery/1-4.jpg', alt: 'Phonics Club learning activity' },
    { src: '/images/gallery/banner.jpg', alt: 'Phonics Club training banner' },
    { src: '/images/gallery/bb.jpg', alt: 'Phonics Club classroom display' },
    { src: '/images/gallery/bk.jpg', alt: 'Jolly Phonics books and learning materials' },
    { src: '/images/gallery/class.jpg', alt: 'Teacher-led phonics classroom session' },
    { src: '/images/gallery/gall.jpg', alt: 'Phonics Club school learning moment' },
    { src: '/images/gallery/gallelryry.jpg', alt: 'Children learning with phonics resources' },
    { src: '/images/gallery/gallery.jpg', alt: 'Phonics Club training and learning gallery' },
    { src: '/images/gallery/galleryyy.jpg', alt: 'Phonics Club classroom group activity' },
    { src: '/images/gallery/galll.jpg', alt: 'Students using phonics materials' },
    { src: '/images/gallery/gallleyryy.jpg', alt: 'Phonics Club workshop moment' },
    { src: '/images/gallery/header.jpg', alt: 'Phonics Club literacy training header' },
    { src: '/images/gallery/jp-blending-wheels.jpg', alt: 'Jolly Phonics blending wheel resources' },
    { src: '/images/gallery/language-lab.jpg', alt: 'Language lab learning setup' },
    { src: '/images/gallery/newsssgall.jpg', alt: 'Phonics Club training news gallery' },
    { src: '/images/gallery/pic.jpg', alt: 'Phonics Club classroom learning' },
    { src: '/images/gallery/pic1.jpg', alt: 'Phonics Club phonics activity' },
    { src: '/images/gallery/pilot.jpg', alt: 'Phonics Club pilot study project' },
    { src: '/images/gallery/pl.jpg', alt: 'Phonics Club practical learning activity' },
    { src: '/images/gallery/pla.jpg', alt: 'Phonics Club school phonics session' },
    { src: '/images/gallery/play.jpg', alt: 'Play-based phonics learning activity' },
    { src: '/images/gallery/researchinpakistan.jpg', alt: 'Phonics Club research in Pakistan' },
  ],
}

export const DEFAULT_POLICIES: Record<string, PolicyContent> = {
  privacy_policy: {
    lastUpdated: 'July 2026',
    intro: ['Welcome to Phonics Club.', 'Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or purchase products from us.'],
    sections: [
      { title: 'Information We Collect', body: ['We may collect your full name, email address, phone number, billing and shipping address, country, order history, device information, and website usage information when needed to provide our services.'] },
      { title: 'How We Use Information', body: ['We use information to process orders, deliver products, verify payments, respond to enquiries, improve website performance, prevent fraud, provide customer support, and send order confirmations or delivery updates.'] },
      { title: 'Payments', body: ['We do not store debit or credit card details. Payments are processed through trusted payment and bank transfer channels.'] },
      { title: 'Sharing Information', body: ['We never sell personal information. Information may be shared only with trusted third parties where necessary, including courier companies, payment processors, hosting providers, analytics providers, security providers, or authorities where legally required.'] },
      { title: 'Cookies and Analytics', body: ['Our website may use cookies to remember preferences, keep users signed in, improve functionality, and understand website usage. You may disable cookies through your browser settings.'] },
      { title: 'Changes to this Policy', body: ['We may update this Privacy Policy from time to time. Any updates become effective when published on this page.'] },
      { title: 'Contact Us', body: ['For questions regarding this Privacy Policy, contact info@phonicsclub.com or support@phonicsclub.com.'] },
    ],
  },
  terms_policy: {
    lastUpdated: 'July 2026',
    intro: ['Welcome to Phonics Club.', 'These Terms of Service govern your use of our website and your purchase of products from us. By using our website, you agree to these Terms.'],
    sections: [
      { title: 'Eligibility', body: ['You must be at least 18 years old to place an order. If you are under 18, a parent or guardian must place the order.'] },
      { title: 'Products', body: ['We make every effort to ensure product descriptions and images are accurate. Colours may vary between screens, product packaging may change, and minor printing differences do not constitute defects.'] },
      { title: 'Orders and Pricing', body: ['Placing an order does not guarantee acceptance. Orders are processed after payment verification and stock confirmation. Prices may change without notice, and the price charged will be the price displayed at checkout.'] },
      { title: 'Payments', body: ['Orders will not be dispatched until payment has been successfully verified. Customers are responsible for submitting accurate payment information and receipts where required.'] },
      { title: 'Shipping', body: ['Delivery times are estimates. Delays may occur due to courier delays, customs, weather, public holidays, or events beyond our control. Customers are responsible for accurate shipping information.'] },
      { title: 'Intellectual Property', body: ['Website content, logos, images, text, graphics, downloads, and educational materials belong to Phonics Club unless otherwise stated. No content may be copied or distributed without written permission.'] },
      { title: 'Changes', body: ['We reserve the right to modify these Terms at any time. Continued use of the website indicates acceptance of updated Terms.'] },
    ],
  },
  refunds_policy: {
    lastUpdated: 'July 2026',
    intro: ['Thank you for shopping with Phonics Club.', 'Please read this policy carefully before placing your order.'],
    sections: [
      { title: 'Product Refunds', body: ['All product sales are final once an order has been confirmed and payment has been successfully processed. Please ensure all order details are correct before completing your purchase.'] },
      { title: 'Exchanges for Damaged Items Only', body: ['We offer exchanges where a product has been received damaged during delivery. Contact us within 48 hours of receiving your order and provide your order number plus clear photographs of the damaged product, packaging, and shipping label.'] },
      { title: 'Incorrect Orders', body: ['If you receive the wrong product due to our error, contact us within 48 hours. We will arrange an exchange at no additional cost after verification.'] },
      { title: 'Course Cancellations', body: ['Classroom course cancellation requests made 15 or more working days before the course start date may be eligible for a refund after a 30% admin fee. Requests made less than 15 working days before the course start date are not eligible for refund.'] },
      { title: 'Course Postponement', body: ['Classroom course postponement requests must be made at least 5 working days before the course start date. Requests made less than 5 working days before the course start date cannot be postponed.'] },
      { title: 'Contact Us', body: ['For exchange or refund requests, contact info@phonicsclub.com and include your order number, name, relevant photos, and a description of the issue.'] },
    ],
  },
  shipping_policy: {
    lastUpdated: 'July 2026',
    intro: ['This Shipping Policy explains how Phonics Club processes and delivers physical products ordered through the website.'],
    sections: [
      { title: 'Delivery Area', body: ['We deliver products across Pakistan using available courier and delivery partners. International delivery is not enabled unless confirmed directly by Phonics Club before ordering.'] },
      { title: 'Processing Time', body: ['Orders are prepared after payment verification and stock confirmation. Processing times may vary during holidays, high-demand periods, or courier delays.'] },
      { title: 'Shipping Charges', body: ['Shipping charges are shown at checkout where applicable. Customers are responsible for entering a complete and accurate delivery address and phone number.'] },
      { title: 'Delivery Issues', body: ['If a parcel is delayed, returned, damaged, or marked delivered but not received, contact Phonics Club with your order number so the team can coordinate with the courier.'] },
      { title: 'Contact Us', body: ['For shipping questions, contact info@phonicsclub.com or support@phonicsclub.com with your order number and delivery details.'] },
    ],
  },
  cookies_policy: {
    lastUpdated: 'July 2026',
    intro: ['This Cookie Policy explains how Phonics Club uses cookies and similar technologies.'],
    sections: [
      { title: 'What Are Cookies?', body: ['Cookies are small text files stored on your device when you visit a website. They help websites function properly and improve user experience.'] },
      { title: 'Essential Cookies', body: ['Essential cookies are required for website security, login sessions, shopping cart, checkout, and payment verification.'] },
      { title: 'Preference Cookies', body: ['Preference cookies may be used to remember language, region, theme, and cookie choices.'] },
      { title: 'Analytics Cookies', body: ['Analytics cookies help us understand website traffic, visitor behaviour, popular pages, and website performance.'] },
      { title: 'Managing Cookies', body: ['Most browsers allow you to block or delete cookies and control cookie preferences. Disabling essential cookies may affect website functionality.'] },
      { title: 'Changes', body: ['We may update this Cookie Policy periodically.'] },
    ],
  },
}

const getCachedContent = unstable_cache(
  async (key: string) => {
    if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    const supabase = await createServiceClient()
    const { data } = await supabase.from('site_content').select('content').eq('key', key).single()
    return data?.content ?? null
  },
  ['site-content'],
  { revalidate: 300, tags: ['site-content'] },
)

async function getUncachedContent<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_content').select('content').eq('key', key).single()
    if (data?.content) return data.content as T
  } catch {
    /* use fallback */
  }
  return fallback
}

export async function getContent<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return getUncachedContent(key, fallback)

  try {
    const content = await getCachedContent(key)
    if (content) return content as T
  } catch {
    /* use fallback */
  }
  return fallback
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item ?? '').trim()).filter(Boolean))]
    : []
}

function normalizeContentImage(value: unknown): ContentImage | null {
  const item = objectRecord(value)
  const src = normalizeMediaUrl(String(item.src ?? '').trim())
  if (!src) return null
  return {
    src,
    alt: String(item.alt ?? '').trim() || 'Trainer gallery image',
    caption: String(item.caption ?? '').trim() || undefined,
  }
}

function normalizeProfileLinkUrl(value: unknown): string {
  const href = String(value ?? '').trim()
  if (!href) return ''
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href
  if (href.startsWith('/')) return href
  if (/^www\./i.test(href)) return `https://${href}`
  return `/${href.replace(/^\/+/, '')}`
}

function normalizeTrainerProfileLink(value: unknown): TrainerProfileLink | null {
  const item = objectRecord(value)
  const href = normalizeProfileLinkUrl(item.href)
  const label = String(item.label ?? '').trim()
  if (!href || !label) return null
  return {
    label,
    href,
    description: String(item.description ?? '').trim() || undefined,
  }
}

export function normalizeTrainerProfileAttachment(value: unknown): TrainerProfileAttachment {
  const item = objectRecord(value)
  return {
    articleSlugs: normalizeStringList(item.articleSlugs),
    relatedLinks: Array.isArray(item.relatedLinks)
      ? item.relatedLinks.map(normalizeTrainerProfileLink).filter(Boolean) as TrainerProfileLink[]
      : [],
    galleryImages: Array.isArray(item.galleryImages)
      ? item.galleryImages.map(normalizeContentImage).filter(Boolean) as ContentImage[]
      : [],
    includeAutoArticles: item.includeAutoArticles !== false,
    includeAutoGallery: item.includeAutoGallery !== false,
  }
}

function logoIdFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeLogoUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '/images/schools/logo.png') return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/public/')) return trimmed.replace(/^\/public/, '')
  if (trimmed.startsWith('public/')) return `/${trimmed.replace(/^public\//, '')}`
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  if (/\s/.test(trimmed)) return ''
  return ''
}

function normalizeSchoolLogo(logo: SchoolLogo, index: number): SchoolLogo {
  const id = logo.id || logoIdFromName(logo.name)
  const normalizedUrl = normalizeLogoUrl(logo.imageUrl)
  const mappedUrl = SCHOOL_LOGO_PATHS[id] ?? SCHOOL_LOGO_PATHS[logoIdFromName(logo.name)]
  const imageUrl = /^https?:\/\//i.test(normalizedUrl)
    ? normalizedUrl
    : mappedUrl ?? normalizedUrl

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

export async function getFaqs(): Promise<FAQItem[]> {
  const items = await getContent<FAQItem[]>('faqs', DEFAULT_FAQS)
  return withDefaultFaqs(items)
}

function normalizeFaqQuestion(question: string) {
  return question.trim().toLowerCase().replace(/\s+/g, ' ')
}

function withDefaultFaqs(items: FAQItem[]) {
  const validItems = items.filter((item) => item.q?.trim() && item.a?.length)
  const savedByQuestion = new Map(validItems.map((item) => [normalizeFaqQuestion(item.q), item]))
  const defaultQuestions = new Set(DEFAULT_FAQS.map((item) => normalizeFaqQuestion(item.q)))
  const restoredDefaults = DEFAULT_FAQS.map((item) => savedByQuestion.get(normalizeFaqQuestion(item.q)) ?? item)
  const customItems = validItems.filter((item) => !defaultQuestions.has(normalizeFaqQuestion(item.q)))
  return [...restoredDefaults, ...customItems]
}

export async function getSocialReels(): Promise<SocialReel[]> {
  const reels = await getContent('social_reels', DEFAULT_SOCIAL_REELS)
  return withRequiredHomepageVideoReels(reels)
}

function withRequiredHomepageVideoReels(reels: SocialReel[]) {
  const replacements = new Map(DEFAULT_SOCIAL_REELS.filter((reel) => reel.id !== '5').map((reel) => [reel.id, reel]))
  const mapped = reels.map((reel) => {
    const replacement = replacements.get(reel.id)
    if (!replacement) return reel
    const isStillDefaultExternal =
      reel.videoUrl === COMPANY.social.youtube ||
      reel.videoUrl === COMPANY.social.instagram ||
      reel.videoUrl === COMPANY.social.facebook ||
      !reel.videoUrl ||
      !reel.thumbnail
    return isStillDefaultExternal ? { ...reel, ...replacement } : reel
  })
  const existingIds = new Set(mapped.map((reel) => reel.id))
  for (const replacement of replacements.values()) {
    if (!existingIds.has(replacement.id)) mapped.push(replacement)
  }
  return mapped
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

function videoSetting(
  data: Partial<WebsiteVideos>,
  key: keyof WebsiteVideos,
  fallback?: string | null
): string {
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    return normalizeMediaUrl(data[key]) ?? ''
  }
  return normalizeMediaUrl(fallback) ?? ''
}

function normalizeVideoSettings(data: Partial<WebsiteVideos>, heroVideo?: HeroVideo): WebsiteVideos {
  return {
    homeHeroVideoUrl: videoSetting(data, 'homeHeroVideoUrl', heroVideo?.videoUrl ?? DEFAULT_WEBSITE_VIDEOS.homeHeroVideoUrl),
    homeHeroDemoUrl: videoSetting(data, 'homeHeroDemoUrl', heroVideo?.demoButtonUrl ?? DEFAULT_WEBSITE_VIDEOS.homeHeroDemoUrl),
    readingSuccessVideoUrl: videoSetting(data, 'readingSuccessVideoUrl', DEFAULT_WEBSITE_VIDEOS.readingSuccessVideoUrl),
    trainingsHeroVideoUrl: videoSetting(data, 'trainingsHeroVideoUrl', DEFAULT_WEBSITE_VIDEOS.trainingsHeroVideoUrl),
    trainingsOnsiteVideoUrl: videoSetting(data, 'trainingsOnsiteVideoUrl', DEFAULT_WEBSITE_VIDEOS.trainingsOnsiteVideoUrl),
  }
}

export async function getWebsiteVideos(): Promise<WebsiteVideos> {
  const [siteVideos, heroVideo] = await Promise.all([
    getContent<Partial<WebsiteVideos>>('site_videos', DEFAULT_WEBSITE_VIDEOS),
    getHeroVideo(),
  ])
  return normalizeVideoSettings(siteVideos, heroVideo)
}

export async function getContactSettings(): Promise<ContactSettings> {
  const settings = await getContent<Partial<ContactSettings>>('contact_settings', DEFAULT_CONTACT_SETTINGS)
  return normalizeContactSettings(settings)
}

export async function getInvoiceTemplate() {
  const template = await getContent('invoice_template', {
    header: 'PHONICS CLUB PVT LTD',
    tagline: '',
    footer:
      'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight. Current standard shipping: PKR 550.',
    bankDetails: COMPANY_BANK_DETAILS,
  })
  const contactSettings = await getContactSettings()

  return {
    ...template,
    contactPhoneDisplay: contactSettings.phoneDisplay,
    bankDetails: COMPANY_BANK_DETAILS,
  }
}

export async function getBankDetails(): Promise<BankDetails> {
  const details = await getContent('bank_details', COMPANY_BANK_DETAILS)
  return normalizeShopBankDetails(details)
}

export async function getCourseBankDetails(): Promise<BankDetails> {
  const details = await getContent('course_bank_details', DEFAULT_COURSE_BANK_DETAILS)
  return normalizeBankDetails(details, DEFAULT_COURSE_BANK_DETAILS)
}

export async function getCourseCatalogueContent(): Promise<CourseCatalogueContent> {
  const content = await getContent('course_catalogue', DEFAULT_COURSE_CATALOGUE_CONTENT)
  return normalizeCourseCatalogueContent(content)
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const data = await getContent('about_page', DEFAULT_ABOUT_PAGE)
  const jollyNotice = { ...DEFAULT_ABOUT_PAGE.jollyNotice, ...(data.jollyNotice ?? {}) }
  return {
    ...DEFAULT_ABOUT_PAGE,
    ...data,
    hero: { ...DEFAULT_ABOUT_PAGE.hero, ...(data.hero ?? {}) },
    overview: { ...DEFAULT_ABOUT_PAGE.overview, ...(data.overview ?? {}) },
    jollyNotice: {
      ...jollyNotice,
      notice: jollyNotice.notice?.length ? jollyNotice.notice : DEFAULT_ABOUT_PAGE.jollyNotice.notice,
    },
    contact: { ...DEFAULT_ABOUT_PAGE.contact, ...(data.contact ?? {}) },
    cta: { ...DEFAULT_ABOUT_PAGE.cta, ...(data.cta ?? {}) },
    whatWeDo: data.whatWeDo ?? DEFAULT_ABOUT_PAGE.whatWeDo,
    whyChoose: data.whyChoose ?? DEFAULT_ABOUT_PAGE.whyChoose,
    services: data.services ?? DEFAULT_ABOUT_PAGE.services,
    showLearningPath: data.showLearningPath ?? DEFAULT_ABOUT_PAGE.showLearningPath,
    learningPath: data.learningPath ?? DEFAULT_ABOUT_PAGE.learningPath,
    milestones: withRequiredAboutMilestones(data.milestones ?? DEFAULT_ABOUT_PAGE.milestones),
    impact: data.impact ?? DEFAULT_ABOUT_PAGE.impact,
    supportImages: data.supportImages ?? DEFAULT_ABOUT_PAGE.supportImages,
    galleryImages: data.galleryImages ?? DEFAULT_ABOUT_PAGE.galleryImages,
  }
}

function withRequiredAboutMilestones(milestones: AboutPageContent['milestones']) {
  const requiredYears = new Set(['2025', '2026'])
  const required = DEFAULT_ABOUT_PAGE.milestones.filter((milestone) => requiredYears.has(milestone.year))
  const years = new Set(milestones.map((milestone) => milestone.year))
  const merged = [...milestones]

  for (const milestone of required) {
    if (!years.has(milestone.year)) merged.push(milestone)
  }

  return merged.sort((a, b) => Number(a.year) - Number(b.year))
}

export async function getResearchPageContent(): Promise<ResearchPageContent> {
  const data = await getContent('research_page', DEFAULT_RESEARCH_PAGE)
  return {
    ...DEFAULT_RESEARCH_PAGE,
    ...data,
    hero: { ...DEFAULT_RESEARCH_PAGE.hero, ...(data.hero ?? {}) },
    overview: data.overview ?? DEFAULT_RESEARCH_PAGE.overview,
    projects: withDefaultResearchProjectImages(data.projects ?? DEFAULT_RESEARCH_PAGE.projects),
    supportImages: withDefaultResearchSupportImages(data.supportImages ?? DEFAULT_RESEARCH_PAGE.supportImages),
  }
}

function withDefaultResearchProjectImages(projects: ResearchProject[]) {
  return projects.map((project, index) => {
    const defaultImages = DEFAULT_RESEARCH_PAGE.projects[index]?.images
    if (project.images?.length || !defaultImages?.length) return project
    return { ...project, images: defaultImages }
  })
}

function withDefaultResearchSupportImages(images: ContentImage[]) {
  const requiredImages = DEFAULT_RESEARCH_PAGE.supportImages
  const normalizedImages = images.map((image) => {
    if (image.src === '/images/schools/partners-strip-2.png' || image.caption === requiredImages[0].caption) {
      return requiredImages[0]
    }
    return image
  })
  const existingSources = new Set(normalizedImages.map((image) => image.src))
  for (const image of requiredImages) {
    if (!existingSources.has(image.src)) normalizedImages.push(image)
  }
  return normalizedImages
}

export async function getHomepageGallery(): Promise<HomepageGalleryContent> {
  const data = await getContent('homepage_gallery', DEFAULT_HOMEPAGE_GALLERY)
  return {
    ...DEFAULT_HOMEPAGE_GALLERY,
    ...data,
    images: data.images ?? DEFAULT_HOMEPAGE_GALLERY.images,
  }
}

export async function getPolicyContent(key: keyof typeof DEFAULT_POLICIES): Promise<PolicyContent> {
  const data = await getContent(key, DEFAULT_POLICIES[key])
  return {
    ...DEFAULT_POLICIES[key],
    ...data,
    intro: data.intro ?? DEFAULT_POLICIES[key].intro,
    sections: data.sections ?? DEFAULT_POLICIES[key].sections,
  }
}

export async function getTrainers() {
  if (!isSupabaseConfigured()) {
    return DEFAULT_TRAINERS
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('trainers')
    .select('*')
    .eq('published', true)
    .order('sort_order')
  return data ?? []
}

export async function getTrainerProfileAttachments(): Promise<TrainerProfileAttachments> {
  const saved = await getContent<Record<string, unknown>>(TRAINER_PROFILE_ATTACHMENTS_KEY, {})
  return Object.fromEntries(
    Object.entries(objectRecord(saved))
      .map(([slug, value]) => [slug, normalizeTrainerProfileAttachment(value)] as const)
      .filter(([slug]) => Boolean(slug.trim())),
  )
}

export async function getTrainerProfileAttachment(slug: string): Promise<TrainerProfileAttachment> {
  const attachments = await getTrainerProfileAttachments()
  return normalizeTrainerProfileAttachment(attachments[slug])
}

export async function getTrainerBySlug(slug: string) {
  const trainers = await getTrainers()
  return trainers.find((trainer) => {
    const trainerSlug = (trainer.slug as string | undefined) || slugify(trainer.name)
    return trainerSlug === slug
  }) ?? null
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
