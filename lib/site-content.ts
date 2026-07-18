import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { CERTIFIED_TRAINERS, COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
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

export interface ContentImage {
  src: string
  alt: string
  caption?: string
}

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
  learningPath: AboutCard[]
  milestones: { year: string; title: string; items: string[] }[]
  impact: { label: string; value: string }[]
  contact: { phones: string[]; emails: string[] }
  cta: { title: string; description: string; href: string; label: string }
  supportImages: ContentImage[]
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
  hero: { title: string; subtitle: string }
  overview: string[]
  projects: ResearchProject[]
  supportImages: ContentImage[]
}

export interface PolicyContent {
  lastUpdated?: string
  intro: string[]
  sections: { title: string; body: string[] }[]
}

export const VORTEX_LEARNING_URL = 'https://officialvortexlear.wixsite.com/vortex-learning'

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: '1', content: 'Phonics Club transformed our school reading program. Jolly Phonics implementation was seamless.', author: 'Beaconhouse School', role: 'Lahore', rating: 5 },
  { id: '2', content: 'The training and materials from Phonics Club are exceptional. Our teachers are confident teaching synthetic phonics.', author: 'LGS Faculty', role: 'Lahore Grammar School', rating: 5 },
  { id: '3', content: 'Best phonics resources in Pakistan. Authorized dealer with full PCTB NOC support.', author: "Froebel's International", role: 'Islamabad', rating: 5 },
]

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', message: 'PCTB-approved Jolly Learning books are available through Phonics Club authorized channels', linkUrl: '/shop', linkText: 'Shop Now', active: true },
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
    'Vortex Learning is a company focused on providing students with different courses and online classes all over the world. Phonics Club works alongside Vortex Learning to make high-quality online education easier to access for students and educators.',
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

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  hero: {
    title: 'Empowering Literacy Through Synthetic Phonics',
    subtitle:
      'Since 2015, Phonics Club Pvt. Ltd. has been helping teachers, schools, and parents build confident readers and writers through internationally recognized Synthetic Phonics methodologies, professional training, curriculum development, and educational consultancy.',
    primaryCta: { label: 'Explore Courses', href: '/courses' },
    secondaryCta: { label: 'Meet Our Trainers', href: '/certified-trainers' },
  },
  overview: {
    title: 'About Phonics Club',
    paragraphs: [
      'Phonics Club Pvt. Ltd. is a registered organization dedicated to promoting the Synthetic Phonics approach to literacy education. The organization equips teachers with the knowledge, confidence, and practical skills required to help children become independent readers, writers, and spellers.',
      'Established in 2015, Phonics Club is an independent organization working across Pakistan and internationally to improve English language education through evidence-based literacy practices.',
      'The organization provides professional teacher training, educational consultancy, curriculum development, school support, language assessments, and internationally aligned literacy programs.',
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
    'Established in 2015',
    'Pioneer of Synthetic Phonics in Pakistan',
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
      'Almost all approved Jolly Learning books are available with the required PCTB approvals, with little or no editing.',
      'Phonics Club has acquired, or is in the process of acquiring, the required NOCs for relevant textbooks and supplementary reading materials.',
    ],
    notice: [
      'School administrations, distributors, and retailers are strongly advised to purchase only through authorized channels.',
      'Some unauthorized editions have been modified to comply with PCTB requirements and may differ from approved versions.',
      'Phonics Club cannot guarantee the authenticity or quality of books purchased through unauthorized dealers.',
      'Customers who purchased books from Phonics Club before the issuance of NOCs should claim their official QR Code verification stickers.',
      'Approved book lists are also available on the PCTB website.',
    ],
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
  ],
  impact: [
    { label: 'Founded', value: '2015' },
    { label: 'Years of Service', value: '10+' },
    { label: 'Teachers and Students Trained', value: '12,000+' },
    { label: 'Schools Supported', value: 'Hundreds' },
    { label: 'Training Programs', value: 'National and International' },
    { label: 'Professional Support', value: 'Online and On-site' },
  ],
  contact: {
    phones: ['0300-8079480', '0302-2220448'],
    emails: ['info@phonicsclub.com', 'phonicsclub@gmail.com'],
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
}

export const DEFAULT_RESEARCH_PAGE: ResearchPageContent = {
  hero: {
    title: 'Research and Pilot Study Projects',
    subtitle:
      'Phonics Club documents classroom evidence, pilot studies, and implementation projects that improve English literacy outcomes through Synthetic Phonics.',
  },
  overview: [
    'Our research activity focuses on practical classroom implementation: training teachers, observing learners, improving methodology, and using evidence to guide future literacy work.',
    'Admins can update this page with new project notes, research photographs, reports, and supporting media from the site content dashboard.',
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
        { label: 'Project launched', href: 'http://punjabeducationfoundation.blogspot.com/2015/05/pilot-project-launched-to-develop.html' },
        { label: 'Training news', href: 'http://www.thenews.com.pk/print/42710-32-associate-professors-promoted' },
      ],
    },
    {
      title: 'Pilot Study Project 2: Literacy Standards and National Roll-out',
      summary: [
        'This project was initiated to raise literacy standards in Pakistan through trials and future national roll-out of the Jolly Phonics Program, a proven method of accelerated English language learning.',
        'The work emphasizes that all tiers of government and all segments of society must respond seriously before Pakistan can overcome literacy challenges and move toward a stronger educational future.',
        'According to the Annual Status of Education Report 2012 by ASER, many children in grade 3 were unable to read and write in English due to educational malpractice. If a child is unable to read and write at the age of 9, their confidence and responsiveness to learning can be deeply affected.',
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
    { src: '/images/schools/partners-strip-2.png', alt: 'Phonics Club research and pilot project partners', caption: 'Supporting evidence, reports, and project images can be added by admins.' },
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
      { title: 'Contact Us', body: ['For questions regarding this Privacy Policy, contact info@phonicsclub.com or phonicsclub@gmail.com.'] },
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

export async function getContent<T>(key: string, fallback: T): Promise<T> {
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
    tagline: '',
    footer:
      'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight. Current standard shipping: PKR 550.',
    bankDetails: COMPANY_BANK_DETAILS,
  })
}

export async function getBankDetails() {
  return getContent('bank_details', COMPANY_BANK_DETAILS)
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const data = await getContent('about_page', DEFAULT_ABOUT_PAGE)
  return {
    ...DEFAULT_ABOUT_PAGE,
    ...data,
    hero: { ...DEFAULT_ABOUT_PAGE.hero, ...(data.hero ?? {}) },
    overview: { ...DEFAULT_ABOUT_PAGE.overview, ...(data.overview ?? {}) },
    jollyNotice: { ...DEFAULT_ABOUT_PAGE.jollyNotice, ...(data.jollyNotice ?? {}) },
    contact: { ...DEFAULT_ABOUT_PAGE.contact, ...(data.contact ?? {}) },
    cta: { ...DEFAULT_ABOUT_PAGE.cta, ...(data.cta ?? {}) },
    whatWeDo: data.whatWeDo ?? DEFAULT_ABOUT_PAGE.whatWeDo,
    whyChoose: data.whyChoose ?? DEFAULT_ABOUT_PAGE.whyChoose,
    services: data.services ?? DEFAULT_ABOUT_PAGE.services,
    learningPath: data.learningPath ?? DEFAULT_ABOUT_PAGE.learningPath,
    milestones: data.milestones ?? DEFAULT_ABOUT_PAGE.milestones,
    impact: data.impact ?? DEFAULT_ABOUT_PAGE.impact,
    supportImages: data.supportImages ?? DEFAULT_ABOUT_PAGE.supportImages,
  }
}

export async function getResearchPageContent(): Promise<ResearchPageContent> {
  const data = await getContent('research_page', DEFAULT_RESEARCH_PAGE)
  return {
    ...DEFAULT_RESEARCH_PAGE,
    ...data,
    hero: { ...DEFAULT_RESEARCH_PAGE.hero, ...(data.hero ?? {}) },
    overview: data.overview ?? DEFAULT_RESEARCH_PAGE.overview,
    projects: data.projects ?? DEFAULT_RESEARCH_PAGE.projects,
    supportImages: data.supportImages ?? DEFAULT_RESEARCH_PAGE.supportImages,
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
    return CERTIFIED_TRAINERS.map((name, i) => ({
      id: String(i + 1),
      name,
      slug: slugify(name),
      title: 'Certified Jolly Phonics Trainer',
      bio: 'Certified trainer supporting teachers with practical Synthetic Phonics implementation and literacy development.',
      image_url: null,
      achievements: ['Certified Jolly Phonics trainer', 'Teacher training and school support experience'],
      credentials: ['Synthetic Phonics training specialist'],
      specialties: ['Teacher training', 'Reading instruction', 'Classroom implementation'],
      profile_details: null,
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
