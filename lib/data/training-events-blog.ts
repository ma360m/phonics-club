import fs from 'fs'
import path from 'path'
import { CANONICAL_URL, APP_NAME } from '@/lib/constants'
import type { BlogGalleryImage, BlogPost } from '@/types/database'
import { TRAINING_EVENT_NEWSLETTER_DETAILS } from './training-event-newsletter-details'

export type BlogEventCategory =
  | 'training'
  | 'events'
  | 'pilot-projects'
  | 'jolly-phonics'
  | 'webinars'
  | 'international'
  | 'news'

export interface TrainingEventArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogEventCategory
  tags: string[]
  location?: string
  venue?: string
  city?: string
  country?: string
  dateDisplay: string
  dateStart?: string
  dateEnd?: string
  sortDate: string
  timeDisplay?: string
  format?: string
  trainer?: string
  guest?: string
  organizer?: string
  partners?: string[]
  collaboration?: string
  participants?: string
  audience?: string
  theme?: string
  galleryFolder: string
  originalPostUrls?: string[]
  newsletterUrl?: string | null
  featured?: boolean
  published: boolean
  seoTitle: string
  seoDescription: string
  body: string[]
  sections?: {
    title: string
    paragraphs?: string[]
    items?: string[]
  }[]
  bulletSection?: {
    title: string
    items: string[]
  }
}

const BLOG_IMAGE_ROOT = '/images/blog'
const LOCAL_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInlineMarkup(value: string) {
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

function articleContentHtml(article: TrainingEventArticle) {
  const paragraphs = article.body.map((paragraph) => `<p>${formatInlineMarkup(paragraph)}</p>`).join('')
  const sections = article.sections
    ?.map((section) => {
      const sectionParagraphs = section.paragraphs?.map((paragraph) => `<p>${formatInlineMarkup(paragraph)}</p>`).join('') ?? ''
      const sectionItems = section.items?.length
        ? `<ul>${section.items.map((item) => `<li>${formatInlineMarkup(item)}</li>`).join('')}</ul>`
        : ''
      return `<h2>${escapeHtml(section.title)}</h2>${sectionParagraphs}${sectionItems}`
    })
    .join('') ?? ''
  const bullets = article.bulletSection
    ? `<h2>${escapeHtml(article.bulletSection.title)}</h2><ul>${article.bulletSection.items.map((item) => `<li>${formatInlineMarkup(item)}</li>`).join('')}</ul>`
    : ''
  return `${paragraphs}${sections}${bullets}`
}

export function listLocalBlogImages(folder: string): BlogGalleryImage[] {
  const absoluteFolder = path.join(process.cwd(), 'public', 'images', 'blog', folder)
  if (!fs.existsSync(absoluteFolder)) return []

  return fs
    .readdirSync(absoluteFolder)
    .filter((file) => LOCAL_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file, index) => ({
      src: `${BLOG_IMAGE_ROOT}/${folder}/${file}`,
      alt: `${folder.replace(/-/g, ' ')} event photograph ${index + 1}`,
      caption: null,
    }))
}

export function getTrainingEventGallery(article: TrainingEventArticle): BlogGalleryImage[] {
  return listLocalBlogImages(article.galleryFolder)
}

export function getTrainingEventHeroImage(article: TrainingEventArticle): string | null {
  return getTrainingEventGallery(article)[0]?.src ?? null
}

export function eventCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    training: 'Training',
    events: 'Events',
    'pilot-projects': 'Pilot Projects',
    'jolly-phonics': 'Jolly Phonics',
    webinars: 'Webinars',
    international: 'International',
    news: 'News',
    teaching: 'Teaching',
    parenting: 'Parenting',
    'phonics-tips': 'Phonics Tips',
    general: 'General',
  }
  return labels[category] ?? category.replace(/-/g, ' ')
}

export function trainingEventToBlogPost(article: TrainingEventArticle): BlogPost {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: articleContentHtml(article),
    category: article.category,
    tags: article.tags,
    cover_image: getTrainingEventHeroImage(article),
    gallery_images: getTrainingEventGallery(article),
    author_id: null,
    published: article.published,
    seo_title: article.seoTitle,
    seo_description: article.seoDescription,
    created_at: article.sortDate,
    updated_at: article.sortDate,
    profiles: { full_name: 'Phonics Club', avatar_url: null },
  }
}

export function getTrainingEventBySlug(slug: string) {
  return TRAINING_EVENT_ARTICLES.find((article) => article.slug === slug && article.published) ?? null
}

export function getTrainingEventBlogPosts(options?: { category?: string; limit?: number }): BlogPost[] {
  let posts = TRAINING_EVENT_ARTICLES
    .filter((article) => article.published)
    .map(trainingEventToBlogPost)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (options?.category) posts = posts.filter((post) => post.category === options.category)
  if (options?.limit) posts = posts.slice(0, options.limit)
  return posts
}

export function getRelatedTrainingEvents(article: TrainingEventArticle, limit = 3) {
  const scored = TRAINING_EVENT_ARTICLES
    .filter((candidate) => candidate.published && candidate.slug !== article.slug)
    .map((candidate) => {
      let score = 0
      if (candidate.category === article.category) score += 5
      if (candidate.city && article.city && candidate.city === article.city) score += 3
      if (candidate.trainer && article.trainer && candidate.trainer === article.trainer) score += 2
      if (candidate.tags.some((tag) => article.tags.includes(tag))) score += 1
      return { candidate, score }
    })
    .sort((a, b) => b.score - a.score || new Date(b.candidate.sortDate).getTime() - new Date(a.candidate.sortDate).getTime())

  return scored.slice(0, limit).map((item) => trainingEventToBlogPost(item.candidate))
}

export function trainingEventJsonLd(article: TrainingEventArticle) {
  const image = getTrainingEventHeroImage(article)
  const location = article.venue || article.location || article.city

  return {
    '@context': 'https://schema.org',
    '@type': article.category === 'webinars' ? 'Event' : 'Article',
    headline: article.title,
    name: article.title,
    description: article.seoDescription || article.excerpt,
    image: image ? [`${CANONICAL_URL}${image}`] : [`${CANONICAL_URL}/og-default.png`],
    datePublished: article.dateStart,
    startDate: article.dateStart,
    endDate: article.dateEnd,
    organizer: article.organizer ? { '@type': 'Organization', name: article.organizer } : { '@type': 'Organization', name: APP_NAME },
    location: location
      ? {
          '@type': 'Place',
          name: location,
          address: [article.city, article.country].filter(Boolean).join(', '),
        }
      : undefined,
    url: `${CANONICAL_URL}/blog/${article.slug}`,
  }
}

const BASE_TRAINING_EVENT_ARTICLES: TrainingEventArticle[] = [
  {
    id: 'event-lahore-american-school-2024',
    slug: 'lahore-american-school-phonics-training-2024',
    title: 'Professional Phonics Training at Lahore American School',
    excerpt: 'Highlights from a professional teacher-training session at Lahore American School conducted by Anum Zehra Zaidi.',
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Lahore'],
    location: 'Lahore American School, Lahore',
    venue: 'Lahore American School',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'November 2024',
    sortDate: '2024-11-01T00:00:00.000Z',
    trainer: 'Anum Zehra Zaidi',
    organizer: 'Phonics Club',
    galleryFolder: 'lahore-american-school-2024',
    originalPostUrls: ['https://www.instagram.com/p/DCO-RIaCwga/'],
    newsletterUrl: null,
    featured: true,
    published: true,
    seoTitle: 'Phonics Training at Lahore American School | Phonics Club',
    seoDescription: 'Highlights from Phonics Club professional teacher training at Lahore American School, conducted by Anum Zehra Zaidi in November 2024.',
    body: [
      'Phonics Club organized a professional teacher-training session at Lahore American School in November 2024, conducted by Anum Zehra Zaidi.',
      'The session formed part of Phonics Club continuing commitment to strengthening early literacy instruction through effective, practical and engaging teaching approaches. Participants explored classroom strategies designed to support the systematic development of children reading, writing and phonics skills.',
      'Through professional development initiatives such as this, Phonics Club continues to connect educators with practical knowledge that can be transferred directly into the classroom.',
    ],
  },
  {
    id: 'event-virtual-university-lahore-2024',
    slug: 'virtual-university-lahore-phonics-training-2024',
    title: 'Teacher Training at Virtual University Campus, Lahore',
    excerpt: 'A professional educator training session at Virtual University Campus, Raiwind Road, Lahore, led by Dr. Fatima Tuz Zahra.',
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Lahore'],
    location: 'Virtual University Campus, Raiwind Road, Lahore',
    venue: 'Virtual University Campus',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'September 2024',
    sortDate: '2024-09-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    galleryFolder: 'virtual-university-lahore-2024',
    originalPostUrls: ['https://www.instagram.com/p/DCQwIApBq3l/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Club Training at Virtual University Lahore',
    seoDescription: 'Professional educator training conducted by Dr. Fatima Tuz Zahra at Virtual University Campus, Raiwind Road, Lahore.',
    body: [
      'Phonics Club organized a professional educator training session at Virtual University Campus, Raiwind Road, Lahore, in September 2024.',
      'Conducted by Dr. Fatima Tuz Zahra, the session focused on strengthening educators understanding of effective phonics-based literacy instruction and translating core teaching principles into meaningful classroom practice.',
      'The workshop provided educators with opportunities for professional learning, discussion and practical engagement, supporting Phonics Club wider mission of improving literacy instruction through teacher development.',
    ],
  },
  {
    id: 'event-coral-george-islamabad-2024',
    slug: 'teaching-english-through-phonics-islamabad-2024',
    title: 'Teaching of English through Phonics - Islamabad',
    excerpt: 'Coral George led an onsite professional phonics training in Islamabad sponsored by Phonics Club and Jolly Learning UK.',
    category: 'international',
    tags: ['International', 'Jolly Phonics Training', 'Islamabad', 'Professional Development'],
    location: 'Islamabad',
    city: 'Islamabad',
    country: 'Pakistan',
    dateDisplay: '30 November 2024',
    dateStart: '2024-11-30',
    sortDate: '2024-11-30T00:00:00.000Z',
    trainer: 'Coral George',
    organizer: 'Phonics Club and Jolly Learning UK',
    partners: ['Jolly Learning UK'],
    format: 'Onsite Professional Training',
    galleryFolder: 'coral-george-islamabad-2024',
    originalPostUrls: ['https://www.instagram.com/reel/DC3uq8AMmq-/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Teaching of English through Phonics | Islamabad Training',
    seoDescription: 'Coral George led an onsite professional phonics training in Islamabad on 30 November 2024, sponsored by Phonics Club and Jolly Learning UK.',
    body: [
      'Phonics Club welcomed professional trainer Coral George to Islamabad for an onsite training session on Teaching of English through Phonics on 30 November 2024.',
      'The professional development session brought educators together to explore effective approaches to early English literacy instruction, with an emphasis on practical strategies that can support children as they develop confidence in reading and writing.',
      'The event reflected the shared commitment of Phonics Club and Jolly Learning UK to supporting educators through high-quality professional development and effective literacy teaching practices.',
    ],
  },
  {
    id: 'event-froebels-lahore-2024',
    slug: 'froebels-international-lahore-phonics-training-2024',
    title: "Professional Training at Froebel's International School, Lahore",
    excerpt: "A December 2024 educator training session at Froebel's International School, Lahore, conducted by Coral George.",
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Lahore'],
    location: "Froebel's International School, Lahore",
    venue: "Froebel's International School",
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'December 2024',
    sortDate: '2024-12-01T00:00:00.000Z',
    trainer: 'Coral George',
    organizer: 'Phonics Club',
    galleryFolder: 'froebels-lahore-2024',
    originalPostUrls: ['https://www.instagram.com/reel/DDUlfnFsEcu/'],
    newsletterUrl: null,
    published: true,
    seoTitle: "Coral George Training at Froebel's International Lahore",
    seoDescription: "Highlights from Phonics Club December 2024 professional training at Froebel's International School, Lahore, conducted by Coral George.",
    body: [
      "In December 2024, Phonics Club organized a professional educator training session at Froebel's International School, Lahore, conducted by Coral George.",
      'The workshop brought together educators for an engaging professional learning experience centred on effective phonics and early literacy instruction. Participants explored practical teaching approaches and strategies designed to make literacy learning systematic, engaging and accessible for young learners.',
      'The event was another important contribution to Phonics Club ongoing work to support schools and educators with high-quality literacy training.',
    ],
  },
  {
    id: 'event-tns-beaconhouse-2024',
    slug: 'tns-beaconhouse-dha-lahore-phonics-training-2024',
    title: 'Phonics Training at TNS Beaconhouse DHA, Lahore',
    excerpt: 'A December 2024 professional development programme at TNS Beaconhouse DHA, Lahore, conducted by Coral George.',
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Lahore'],
    location: 'TNS Beaconhouse DHA, Lahore',
    venue: 'TNS Beaconhouse DHA',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'December 2024',
    sortDate: '2024-12-02T00:00:00.000Z',
    trainer: 'Coral George',
    organizer: 'Dr. Fatima Tuz Zahra and the Phonics Club Team',
    galleryFolder: 'tns-beaconhouse-2024',
    originalPostUrls: ['https://www.instagram.com/reel/DDUlsW1s2bY/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Training at TNS Beaconhouse DHA Lahore',
    seoDescription: 'Coral George conducted professional phonics training at TNS Beaconhouse DHA, Lahore, organized by Dr. Fatima Tuz Zahra and Phonics Club.',
    body: [
      'Phonics Club continued its December 2024 professional development programme with a training session at TNS Beaconhouse DHA, Lahore, conducted by internationally experienced trainer Coral George.',
      'Organized by Dr. Fatima Tuz Zahra and the Phonics Club team, the session provided educators with an opportunity to deepen their understanding of structured phonics instruction and explore practical strategies for developing children early reading and writing skills.',
      'The workshop reflected Phonics Club commitment to connecting educators in Pakistan with quality professional learning opportunities and effective literacy practices.',
    ],
  },
  {
    id: 'event-karachi-mohiuddins-2024',
    slug: 'mohiuddins-montessori-karachi-phonics-training-2024',
    title: "Professional Training at Mrs. Mohiuddin's Montessori, Karachi",
    excerpt: "Coral George conducted a professional training session at Mrs. Mohiuddin's Montessori in Karachi.",
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Karachi'],
    location: "Mrs. Mohiuddin's Montessori, Karachi",
    venue: "Mrs. Mohiuddin's Montessori",
    city: 'Karachi',
    country: 'Pakistan',
    dateDisplay: 'December 2024',
    sortDate: '2024-12-03T00:00:00.000Z',
    trainer: 'Coral George',
    organizer: 'Phonics Club',
    collaboration: 'Local coordination by Anum Zehra Zaidi and the Phonics Club Team',
    galleryFolder: 'karachi-mohiuddins-2024',
    originalPostUrls: ['https://www.instagram.com/p/DEIJCh2tgkR/'],
    newsletterUrl: null,
    published: true,
    seoTitle: "Phonics Training at Mrs. Mohiuddin's Montessori Karachi",
    seoDescription: 'Professional phonics training conducted by Coral George in Karachi with coordination by Anum Zehra Zaidi and the Phonics Club team.',
    body: [
      "In December 2024, Phonics Club organized a professional training session at Mrs. Mohiuddin's Montessori in Karachi, conducted by Coral George.",
      'The event was coordinated by Anum Zehra Zaidi and the Phonics Club team and brought together educators interested in strengthening their knowledge and classroom application of phonics-based literacy instruction.',
      'The training contributed to Phonics Club continuing professional development initiatives across Pakistan, helping educators access practical approaches for building stronger foundations in reading and writing.',
    ],
  },
  {
    id: 'event-allaudin-academy-2025',
    slug: 'allaudin-academy-lahore-teacher-training-2025',
    title: 'Teacher Training at Allaudin Academy, Lahore',
    excerpt: 'A professional teacher-training programme at Allaudin Academy, Lahore, led by Dr. Fatima Tuz Zahra.',
    category: 'training',
    tags: ['Professional Development', 'Lahore', 'Jolly Phonics Training'],
    location: 'Allaudin Academy, Lahore',
    venue: 'Allaudin Academy',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'January/February 2025',
    sortDate: '2025-02-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    galleryFolder: 'allaudin-academy-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Teacher Training at Allaudin Academy Lahore | Phonics Club',
    seoDescription: 'Professional teacher training at Allaudin Academy, Lahore, led by Dr. Fatima Tuz Zahra.',
    body: [
      'Phonics Club organized a professional teacher-training programme at Allaudin Academy, Lahore, during January/February 2025.',
      'Led by Dr. Fatima Tuz Zahra, the training focused on strengthening educators knowledge of phonics-based English literacy instruction and helping teachers translate effective methodology into classroom practice.',
      'Participants explored strategies for developing children foundational reading, writing and language skills through structured and engaging instruction.',
    ],
  },
  {
    id: 'event-akrsp-gilgit-2025',
    slug: 'akrsp-pilot-project-gilgit-training-2025',
    title: 'AKRSP Pilot Project - Gilgit Training',
    excerpt: 'A pilot-project educator training programme at Ibex Resort, Gilgit, led by Dr. Fatima Tuz Zahra.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Northern Pakistan', 'Gilgit', 'Professional Development'],
    location: 'Ibex Resort, Gilgit',
    venue: 'Ibex Resort',
    city: 'Gilgit',
    country: 'Pakistan',
    dateDisplay: 'April 2025',
    sortDate: '2025-04-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    galleryFolder: 'akrsp-gilgit-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Club Pilot Project Training in Gilgit | April 2025',
    seoDescription: 'Pilot-project phonics training at Ibex Resort, Gilgit, led by Dr. Fatima Tuz Zahra in April 2025.',
    body: [
      'As part of Phonics Club literacy development and pilot-project initiatives, a professional educator training programme was conducted at Ibex Resort, Gilgit, in April 2025.',
      'Led by Dr. Fatima Tuz Zahra, the programme focused on building educator capacity and supporting the implementation of effective phonics-based literacy instruction.',
      'The Gilgit training represented an important step in extending professional literacy support to educators in the region and strengthening sustainable classroom implementation.',
    ],
  },
  {
    id: 'event-akrsp-skardu-2025',
    slug: 'akrsp-pilot-project-skardu-training-2025',
    title: 'AKRSP Pilot Project - Skardu Training',
    excerpt: 'Phonics Club extended its pilot-project training activities to AKRSP, Skardu, in April 2025.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Northern Pakistan', 'Skardu', 'Professional Development'],
    location: 'AKRSP, Skardu',
    venue: 'AKRSP',
    city: 'Skardu',
    country: 'Pakistan',
    dateDisplay: 'April 2025',
    sortDate: '2025-04-02T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    galleryFolder: 'akrsp-skardu-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'AKRSP Pilot Project Phonics Training in Skardu | Phonics Club',
    seoDescription: 'Pilot-project phonics training at AKRSP, Skardu, led by Dr. Fatima Tuz Zahra in April 2025.',
    body: [
      'Phonics Club extended its pilot-project training activities to Skardu in April 2025, where a professional educator development session was conducted at AKRSP.',
      'Led by Dr. Fatima Tuz Zahra, the training supported educators in developing practical knowledge and skills for effective phonics-based literacy instruction.',
      'The initiative formed part of a broader effort to strengthen teacher capacity, support classroom implementation and contribute to improved literacy outcomes through sustainable professional development.',
    ],
  },
  {
    id: 'event-akrsp-karachi-2025',
    slug: 'akrsp-pilot-project-karachi-training-2025',
    title: 'AKRSP Pilot Project - Two-Day Training in Karachi',
    excerpt: 'A two-day educator training programme in Karachi delivered in collaboration with Jolly Learning and AKRSP.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Karachi', 'Jolly Learning', 'Professional Development'],
    location: 'Karachi',
    city: 'Karachi',
    country: 'Pakistan',
    dateDisplay: 'July 2025',
    sortDate: '2025-07-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    partners: ['Jolly Learning', 'AKRSP'],
    collaboration: 'Phonics Club, Jolly Learning and AKRSP',
    galleryFolder: 'karachi-akrsp-2025',
    originalPostUrls: ['https://www.instagram.com/p/DNNA0InCFqa/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'AKRSP Pilot Project Phonics Training in Karachi | July 2025',
    seoDescription: 'Phonics Club, Jolly Learning and AKRSP collaborated on a two-day educator training programme in Karachi led by Dr. Fatima Tuz Zahra.',
    body: [
      'As part of the AKRSP Pilot Project, the Phonics Club team, in collaboration with Jolly Learning and AKRSP, hosted an impactful two-day educator training programme in Karachi in July 2025.',
      'Conducted by Dr. Fatima Tuz Zahra, the programme focused on strengthening educators capacity to deliver effective, structured and engaging literacy instruction.',
      'The two-day programme combined professional learning with practical classroom strategies, helping participants develop greater confidence in implementing phonics-based approaches with young learners.',
      'The Karachi programme marked another important milestone in the continuing collaboration to support teachers and improve literacy learning opportunities.',
    ],
  },
  {
    id: 'event-christopher-jolly-lahore-2025',
    slug: 'christopher-jolly-lahore-literacy-event-2025',
    title: 'Christopher Jolly in Lahore - A Landmark Literacy Event',
    excerpt: 'Christopher Jolly visited Lahore for a special Teaching Jolly Phonics event at Children Library Complex.',
    category: 'events',
    tags: ['Christopher Jolly in Pakistan', 'Lahore', 'Jolly Phonics', 'International'],
    location: 'Children Library Complex, Lahore',
    venue: 'Children Library Complex',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: '10 September 2025',
    dateStart: '2025-09-10',
    sortDate: '2025-09-10T00:00:00.000Z',
    guest: 'Christopher Jolly',
    theme: 'Teaching Jolly Phonics',
    organizer: 'Phonics Club',
    galleryFolder: 'christopher-jolly-lahore-2025',
    originalPostUrls: ['https://www.instagram.com/p/DNXk3g1ieq7/'],
    newsletterUrl: null,
    featured: true,
    published: true,
    seoTitle: 'Christopher Jolly Visits Lahore | Jolly Phonics Event 2025',
    seoDescription: 'Christopher Jolly visited Lahore on 10 September 2025 for a special Teaching Jolly Phonics session at the Children Library Complex.',
    body: [
      'Phonics Club was delighted to welcome Christopher Jolly, founder of Jolly Learning and publisher of Jolly Phonics, to Lahore for a special educational event at the Children Library Complex on 10 September 2025.',
      'The session offered educators a valuable opportunity to engage with the story, philosophy and classroom impact of Jolly Phonics and to hear directly from one of the key figures behind the programme international development.',
      'The event brought together members of the education community with a shared interest in effective early literacy instruction and represented a memorable milestone for the Jolly Phonics community in Pakistan.',
    ],
  },
  {
    id: 'event-jolly-morning-day-2025',
    slug: 'jolly-morning-day-nscoe-lahore-2025',
    title: 'Jolly Morning Day at NSCOE, Children Library Complex Lahore',
    excerpt: 'A vibrant Jolly Morning Day at NSCOE, Children Library Complex Lahore, celebrating active and multisensory literacy learning.',
    category: 'events',
    tags: ['Jolly Phonics', 'Lahore', 'Professional Development'],
    location: 'NSCOE, Children Library Complex, Lahore',
    venue: 'NSCOE, Children Library Complex',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'Date to be added',
    sortDate: '2025-10-01T00:00:00.000Z',
    organizer: 'Phonics Club',
    galleryFolder: 'jolly-morning-day-2025',
    originalPostUrls: [
      'https://www.instagram.com/p/DOu7uAkggV3/',
      'https://www.instagram.com/p/DOu7zHPAugs/',
      'https://www.instagram.com/p/DPcxFf6gmvR/',
    ],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Jolly Morning Day at NSCOE Lahore | Phonics Club',
    seoDescription: 'A Jolly Morning Day at NSCOE, Children Library Complex Lahore, celebrating engaging approaches to literacy and Jolly Phonics.',
    body: [
      'A vibrant Jolly Morning Day at NSCOE, Children Library Complex Lahore brought educators and the learning community together to celebrate engaging approaches to literacy and Jolly Phonics.',
      'The programme highlighted the importance of making early literacy active, multisensory and enjoyable while giving participants opportunities to experience the energy and creativity associated with effective phonics teaching.',
      'The event reflected the continuing relationship between professional learning, classroom practice and Phonics Club wider literacy mission.',
    ],
  },
  {
    id: 'event-christopher-jolly-chitral-2025',
    slug: 'christopher-jolly-chitral-2025',
    title: 'Christopher Jolly Visits Chitral',
    excerpt: 'Christopher Jolly visited The Langlands School and College, Chitral, for a special Teaching Jolly Phonics session.',
    category: 'events',
    tags: ['Christopher Jolly in Pakistan', 'Northern Pakistan', 'Chitral', 'Jolly Phonics'],
    location: 'The Langlands School and College, Chitral',
    venue: 'The Langlands School and College',
    city: 'Chitral',
    country: 'Pakistan',
    dateDisplay: '8 September 2025',
    dateStart: '2025-09-08',
    sortDate: '2025-09-08T00:00:00.000Z',
    guest: 'Christopher Jolly',
    theme: 'Teaching Jolly Phonics',
    organizer: 'Phonics Club',
    galleryFolder: 'christopher-jolly-chitral-2025',
    originalPostUrls: ['https://www.instagram.com/p/DOmBS9KDXCT/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Christopher Jolly at The Langlands School Chitral | 2025',
    seoDescription: 'Christopher Jolly visited The Langlands School and College, Chitral, on 8 September 2025 for a Teaching Jolly Phonics session.',
    body: [
      'The literacy community in Chitral welcomed Christopher Jolly, founder of Jolly Learning and publisher of Jolly Phonics, on 8 September 2025 for a special session at The Langlands School and College.',
      'The event centred on the teaching of Jolly Phonics and provided educators with an exceptional opportunity to engage with the principles and development of the programme.',
      'The Chitral session formed part of an important series of professional literacy engagements in Pakistan and demonstrated the shared commitment of educators and partner organizations to strengthening early reading and writing instruction.',
    ],
  },
  {
    id: 'event-jolly-experience-day-islamabad-2025',
    slug: 'jolly-experience-day-islamabad-2025',
    title: 'Jolly Experience Day - Islamabad',
    excerpt: 'A special Jolly Experience Day in Islamabad with Christopher Jolly and experienced Jolly Phonics trainers.',
    category: 'events',
    tags: ['Christopher Jolly in Pakistan', 'Islamabad', 'Jolly Phonics', 'Professional Development'],
    location: 'Islamabad',
    city: 'Islamabad',
    country: 'Pakistan',
    dateDisplay: 'September 2025',
    sortDate: '2025-09-01T00:00:00.000Z',
    guest: 'Christopher Jolly',
    theme: 'Jolly Experience Day',
    organizer: 'Phonics Club',
    participants: 'Tahira Sheikh, Erum Tehreem, Fatemah Imran, Tamkanat Zafar, Saima Mazhar, Dr. Fatima Tuz Zahra and Christopher Jolly',
    galleryFolder: 'jolly-experience-day-islamabad-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Jolly Experience Day Islamabad with Christopher Jolly | 2025',
    seoDescription: 'A Jolly Experience Day in Islamabad with Christopher Jolly and experienced trainers including Dr. Fatima Tuz Zahra.',
    body: [
      'Islamabad hosted a special Jolly Experience Day in September 2025, bringing together educators, trainers and members of the literacy community for an inspiring professional learning experience.',
      'The event featured Christopher Jolly alongside experienced trainers Tahira Sheikh, Erum Tehreem, Fatemah Imran, Tamkanat Zafar, Saima Mazhar and Dr. Fatima Tuz Zahra.',
      'Through a series of sessions, participants explored practical dimensions of Jolly Phonics and effective literacy teaching. A special Meet and Greet with Christopher Jolly added a memorable dimension to the event and provided attendees with an opportunity for professional interaction and exchange.',
    ],
  },
  {
    id: 'event-gilgit-hunza-2026',
    slug: 'jolly-phonics-training-gilgit-hunza-2026',
    title: 'Jolly Phonics Training Workshops - Gilgit and Hunza',
    excerpt: 'Saima Mazhar led Jolly Phonics Training Workshops in Gilgit and Hunza on 11 and 12 April 2026.',
    category: 'jolly-phonics',
    tags: ['Jolly Phonics Training', 'Northern Pakistan', 'Gilgit & Hunza', 'Professional Development'],
    location: 'Gilgit and Hunza',
    city: 'Gilgit and Hunza',
    country: 'Pakistan',
    dateDisplay: 'Gilgit: 11 April 2026 | Hunza: 12 April 2026',
    dateStart: '2026-04-11',
    dateEnd: '2026-04-12',
    sortDate: '2026-04-12T00:00:00.000Z',
    trainer: 'Saima Mazhar',
    organizer: 'Phonics Club',
    galleryFolder: 'gilgit-hunza-2026',
    originalPostUrls: ['https://www.instagram.com/p/DX1JLIQAq0_/'],
    newsletterUrl: 'https://gnxgopyshgeistkcexib.supabase.co/storage/v1/object/public/newsletters/2026/05-1784009199862-phonics-club-2-.pdf',
    published: true,
    seoTitle: 'Jolly Phonics Training in Gilgit & Hunza | April 2026',
    seoDescription: 'Phonics Club organized Jolly Phonics workshops in Gilgit and Hunza on 11-12 April 2026, conducted by Saima Mazhar.',
    body: [
      'Phonics Club organized two professional Jolly Phonics Training Workshops in Gilgit and Hunza on 11 and 12 April 2026, led by Saima Mazhar.',
      'Designed for teachers, school leaders and parents, the workshops provided participants with a practical introduction to the Jolly Phonics approach and demonstrated techniques that can be used to strengthen children early literacy development.',
      'These workshops continued Phonics Club commitment to extending quality professional development opportunities to educators across Pakistan.',
    ],
    bulletSection: {
      title: 'Key areas included',
      items: [
        'Step-by-step understanding of the Jolly Phonics approach',
        'Practical classroom activities and teaching techniques',
        'Strategies supporting reading, writing and pronunciation',
        'Multisensory approaches to literacy learning',
        'Guidance for effective classroom implementation',
      ],
    },
  },
  {
    id: 'event-lahore-april-training-2026',
    slug: 'jolly-phonics-training-workshop-lahore-april-2026',
    title: 'Jolly Phonics Training Workshop - Lahore',
    excerpt: 'A Jolly Phonics Training Workshop at Unique School, Township Branch, Lahore, in collaboration with Starfish Pakistan School.',
    category: 'jolly-phonics',
    tags: ['Jolly Phonics Training', 'Lahore', 'Professional Development'],
    location: 'Unique School, Township Branch, Lahore',
    venue: 'Unique School, Township Branch',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: '18 April 2026',
    dateStart: '2026-04-18',
    sortDate: '2026-04-18T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    collaboration: 'Starfish Pakistan School',
    partners: ['Starfish Pakistan School'],
    participants: 'Under the leadership of Ms. Caroline White, with special acknowledgment to Professor Irfan Akhtar',
    galleryFolder: 'lahore-training-april-2026',
    originalPostUrls: ['https://www.instagram.com/p/DX1FqduAvux/'],
    newsletterUrl: null,
    published: true,
    seoTitle: 'Jolly Phonics Training Workshop Lahore | 18 April 2026',
    seoDescription: 'Jolly Phonics Training Workshop in Lahore on 18 April 2026 at Unique School, Township Branch, led by Dr. Fatima Tuz Zahra.',
    body: [
      'The Jolly Phonics Training Workshop in Lahore was conducted on 18 April 2026 at Unique School, Township Branch, in collaboration with Starfish Pakistan School.',
      'The professional development session was led by Dr. Fatima Tuz Zahra under the leadership of Ms. Caroline White.',
      'The programme focused on practical and effective approaches to phonics-based literacy teaching, providing participating educators with strategies and knowledge that could be transferred into classroom practice.',
      'Special acknowledgment is extended to Professor Irfan Akhtar for his valuable support in making the professional learning initiative possible.',
    ],
  },
  {
    id: 'event-nscoe-refresher-2026',
    slug: 'pilot-project-refresher-training-nscoe-lahore-2026',
    title: 'Pilot Project Refresher Training at NSCOE Lahore',
    excerpt: 'A refresher training programme for pilot-project schools at NSCOE, Children Library Complex Lahore.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Lahore', 'Professional Development'],
    location: 'NSCOE, Children Library Complex, Lahore',
    venue: 'NSCOE, Children Library Complex',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'January 2026',
    sortDate: '2026-01-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    participants: 'Pilot Project Schools',
    galleryFolder: 'nscoe-refresher-lahore-2026',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Pilot Project Refresher Training at NSCOE Lahore | 2026',
    seoDescription: 'Phonics Club conducted a refresher training programme for pilot-project schools at NSCOE Lahore in January 2026.',
    body: [
      'Phonics Club conducted a refresher training programme for pilot-project schools at NSCOE, Children Library Complex Lahore, in January 2026.',
      'Led by Dr. Fatima Tuz Zahra, the programme was designed to reinforce previous professional learning, revisit key teaching practices and support educators with the continuing implementation of phonics-based literacy instruction.',
      'Refresher training is an important component of sustainable professional development because it allows educators to revisit methodology, discuss classroom experiences and strengthen implementation over time.',
    ],
  },
  {
    id: 'event-nscoe-workshop-2025',
    slug: 'pilot-project-training-workshop-nscoe-lahore-2025',
    title: 'Pilot Project Training Workshop at NSCOE Lahore',
    excerpt: 'A professional training workshop for pilot-project schools at NSCOE, Children Library Complex Lahore, in August 2025.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Lahore', 'Professional Development'],
    location: 'NSCOE, Children Library Complex, Lahore',
    venue: 'NSCOE, Children Library Complex',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: 'August 2025',
    sortDate: '2025-08-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    participants: 'Pilot Project Schools',
    galleryFolder: 'nscoe-workshop-lahore-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Club Pilot Project Workshop at NSCOE Lahore | August 2025',
    seoDescription: 'Phonics Club conducted a pilot-project training workshop at NSCOE, Children Library Complex Lahore, in August 2025.',
    body: [
      'In August 2025, Phonics Club conducted a professional training workshop for pilot-project schools at NSCOE, Children Library Complex Lahore.',
      'Led by Dr. Fatima Tuz Zahra, the workshop supported participating educators in developing the knowledge and practical teaching skills required for effective classroom implementation.',
      'The programme represented an important component of Phonics Club pilot-project work, combining professional development with ongoing implementation support to encourage sustainable improvements in literacy teaching.',
    ],
  },
  {
    id: 'event-jolly-grammar-english-webinar-2026',
    slug: 'free-webinar-jolly-grammar-jolly-english-2026',
    title: 'Free Webinar - Jolly Grammar & Jolly English',
    excerpt: 'A free online webinar on Jolly Grammar and Jolly English for teachers, parents and educators.',
    category: 'webinars',
    tags: ['Webinars', 'Jolly Grammar', 'Jolly English', 'Professional Development'],
    dateDisplay: '16 May 2026',
    dateStart: '2026-05-16',
    sortDate: '2026-05-16T00:00:00.000Z',
    timeDisplay: '11:00 AM - 1:00 PM',
    format: 'Online Webinar',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    audience: 'Teachers, Parents and Educators',
    galleryFolder: 'jolly-grammar-english-webinar-2026',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Free Jolly Grammar & Jolly English Webinar | Phonics Club',
    seoDescription: 'Phonics Club hosted a free Jolly Grammar and Jolly English webinar for teachers, parents and educators on 16 May 2026.',
    body: [
      'Phonics Club hosted a free professional webinar on Jolly Grammar and Jolly English on 16 May 2026.',
      'Conducted by Dr. Fatima Tuz Zahra, the online session was designed for teachers, parents and educators interested in developing their understanding of English literacy and language instruction beyond the initial stages of phonics.',
      'The webinar formed part of Phonics Club commitment to making professional learning accessible to a wider community of educators and parents.',
    ],
  },
  {
    id: 'event-failure-pit-webinar-2026',
    slug: 'international-webinar-failure-pit-learning-success-2026',
    title: 'International Webinar - Helping Children Climb Out of the Failure Pit',
    excerpt: 'An international collaborative webinar on helping children overcome repeated difficulty and experience learning success.',
    category: 'international',
    tags: ['Webinars', 'International', 'Professional Development'],
    dateDisplay: '2 June 2026',
    dateStart: '2026-06-02',
    sortDate: '2026-06-02T00:00:00.000Z',
    timeDisplay: '6:30 PM Perth Time',
    format: 'International Online Collaboration',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    participants: 'Additional international contributors to be added',
    galleryFolder: 'failure-pit-webinar-2026',
    newsletterUrl: null,
    published: true,
    seoTitle: 'International Education Webinar: Helping Children Achieve Learning Success',
    seoDescription: 'An international collaborative webinar with Dr. Fatima Tuz Zahra and education colleagues on helping children experience learning success.',
    body: [
      'How can educators help children climb out of the Failure Pit and experience meaningful learning success?',
      'This important international collaborative webinar brought educators together to discuss one of education most significant challenges: how to support children who experience repeated difficulty, frustration or lack of success in learning.',
      'Dr. Fatima Tuz Zahra, together with international education colleagues, contributed to a collaborative professional discussion centred on sharing ideas, experiences and strategies for helping more children experience successful learning.',
      'The session emphasized professional collaboration and the value of educators learning from one another across different contexts.',
      'Contributor note: remaining international speakers will be added once confirmed.',
    ],
  },
  {
    id: 'event-al-fatah-chakwal',
    slug: 'al-fatah-school-chakwal-phonics-training',
    title: 'Professional Training at Al-Fatah School, Chakwal',
    excerpt: 'A professional teacher-training session at Al-Fatah School, Chakwal, conducted by Tahira Sheikh.',
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Chakwal'],
    location: 'Al-Fatah School, Chakwal',
    venue: 'Al-Fatah School',
    city: 'Chakwal',
    country: 'Pakistan',
    dateDisplay: '5 August 2026',
    dateStart: '2026-08-05',
    sortDate: '2026-08-05T00:00:00.000Z',
    trainer: 'Tahira Sheikh',
    organizer: 'Phonics Club',
    galleryFolder: 'al-fatah-school-chakwal',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Training at Al-Fatah School Chakwal | Phonics Club',
    seoDescription: 'Professional phonics training at Al-Fatah School, Chakwal, conducted by Tahira Sheikh and organized by Phonics Club.',
    body: [
      'Phonics Club organized a professional teacher-training session at Al-Fatah School, Chakwal, conducted by Tahira Sheikh.',
      'The workshop supported educators in strengthening their understanding of effective phonics instruction and applying structured literacy strategies within their classrooms.',
      'Through practical professional development opportunities such as this, Phonics Club continues to support teachers and schools in building stronger foundations for children reading, writing and language development.',
    ],
  },
  {
    id: 'event-bright-vision-lahore',
    slug: 'bright-vision-school-lahore-phonics-training',
    title: 'Professional Training at Bright Vision School, Lahore',
    excerpt: 'A professional training programme at Bright Vision School, Lahore, conducted by Dr. Fatima Tuz Zahra with support from Principal Atika.',
    category: 'training',
    tags: ['Professional Development', 'Jolly Phonics Training', 'Lahore'],
    location: 'Bright Vision School, Lahore',
    venue: 'Bright Vision School',
    city: 'Lahore',
    country: 'Pakistan',
    dateDisplay: '6 August 2026',
    dateStart: '2026-08-06',
    sortDate: '2026-08-06T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    participants: 'Support and coordination by Principal Atika and Vice Principal Ms. Madiha',
    galleryFolder: 'bright-vision-school-lahore',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Phonics Training at Bright Vision School Lahore | Phonics Club',
    seoDescription: 'Professional phonics training at Bright Vision School, Lahore, conducted by Dr. Fatima Tuz Zahra with support from Principal Atika.',
    body: [
      'Phonics Club organized a professional training programme at Bright Vision School, Lahore, on 6 August 2026, conducted by Dr. Fatima Tuz Zahra with the support of Principal Atika.',
      'The training brought professional literacy development directly into the school environment, enabling educators to explore practical approaches to phonics-based reading and writing instruction.',
      'The programme emphasized effective classroom implementation and the importance of confident, well-supported teachers in establishing strong literacy foundations for children.',
      'Vice Principal Ms. Madiha handled many important arrangements and helped the session run smoothly. The training went extremely well, with strong participation and a positive professional learning environment.',
      'Phonics Club appreciates the cooperation and support of Principal Atika, Vice Principal Ms. Madiha and the Bright Vision School team in facilitating the professional learning programme.',
    ],
  },
  {
    id: 'event-gujranwala-pilot-project-training-2025',
    slug: 'gujranwala-pilot-project-teacher-training-september-2025',
    title: 'Gujranwala Pilot Project Teacher Training - September 2025',
    excerpt: 'Phonics Club organized professional pilot-project training in Gujranwala in September 2025, conducted by Dr. Fatima Tuz Zahra to strengthen systematic phonics and early literacy teaching.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Gujranwala', 'Teacher Training', 'Professional Development'],
    location: 'Gujranwala',
    city: 'Gujranwala',
    country: 'Pakistan',
    dateDisplay: 'September 2025',
    dateStart: '2025-09-01',
    sortDate: '2025-09-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    format: 'Pilot Project',
    galleryFolder: 'gujranwala-pilot-project-training-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Gujranwala Pilot Project Training | Phonics Club 2025',
    seoDescription: "Dr. Fatima Tuz Zahra conducted Phonics Club's Gujranwala Pilot Project teacher training in September 2025, supporting effective phonics and literacy instruction.",
    body: [
      "As part of its continuing commitment to strengthening early literacy education, Phonics Club organized a professional teacher-training programme in **Gujranwala in September 2025** under its pilot-project initiative.",
      'The training was conducted by **Dr. Fatima Tuz Zahra** and focused on equipping participating educators with the knowledge, confidence and practical strategies required to implement systematic phonics-based literacy instruction in their classrooms.',
      'The programme emphasized the importance of building strong foundations in reading and writing through carefully structured teaching. Educators explored practical approaches for supporting sound recognition, blending for reading, segmenting for spelling and the gradual development of independent literacy skills.',
      'A key focus of the pilot-project training was classroom implementation. Participants were encouraged to connect professional learning with the everyday needs of their learners and to create engaging, supportive environments in which children could develop confidence as readers and writers.',
      "The Gujranwala programme represented another important step in Phonics Club's wider efforts to support schools through professional development, implementation guidance and continuing teacher support.",
      'Through initiatives such as this, Phonics Club continues to work towards sustainable improvements in literacy teaching by investing in the professional knowledge and classroom practice of educators.',
    ],
  },
  {
    id: 'event-gujranwala-pilot-project-refresher-2026',
    slug: 'gujranwala-pilot-project-refresher-training-january-2026',
    title: 'Gujranwala Pilot Project Refresher Training - January 2026',
    excerpt: 'Dr. Fatima Tuz Zahra led a Phonics Club refresher programme for the Gujranwala Pilot Project in January 2026, reinforcing effective classroom implementation and literacy teaching.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Gujranwala', 'Refresher Training', 'Professional Development'],
    location: 'Gujranwala',
    city: 'Gujranwala',
    country: 'Pakistan',
    dateDisplay: 'Mid-January 2026',
    dateStart: '2026-01-15',
    sortDate: '2026-01-15T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    format: 'Pilot Project Refresher Training',
    galleryFolder: 'gujranwala-pilot-project-refresher-2026',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Gujranwala Pilot Project Refresher Training | January 2026',
    seoDescription: 'Phonics Club conducted a Gujranwala Pilot Project refresher training led by Dr. Fatima Tuz Zahra in January 2026 to strengthen classroom implementation.',
    body: [
      'Following the earlier pilot-project training in Gujranwala, Phonics Club conducted a **refresher training programme in mid-January 2026**, led by **Dr. Fatima Tuz Zahra**.',
      'The refresher session was designed to reinforce professional learning and support educators as they continued implementing phonics-based literacy instruction within their classrooms.',
      'Rather than simply repeating the initial programme, the refresher training provided an opportunity to revisit key principles with the benefit of practical classroom experience. Teachers could reflect on implementation, strengthen areas requiring further attention and consolidate effective teaching practices.',
      'The programme reinforced systematic progression in phonics, reading, spelling and writing while emphasizing consistency, learner engagement and confident classroom delivery.',
      'Ongoing professional support is an important component of sustainable educational improvement. By following initial training with refresher programmes, Phonics Club aims to help educators move from understanding a methodology to implementing it effectively and consistently.',
      "The Gujranwala refresher programme demonstrated Phonics Club's commitment to accompanying participating schools throughout their professional development journey and supporting long-term improvements in literacy teaching.",
    ],
  },
  {
    id: 'event-chitral-pilot-project-training-2025',
    slug: 'chitral-pilot-project-teacher-training-fall-2025',
    title: 'Chitral Pilot Project Teacher Training - Fall 2025',
    excerpt: 'Tahira Sheikh conducted pilot-project teacher training in Chitral during Fall 2025, organized by Jolly Learning UK to support effective phonics and literacy instruction.',
    category: 'pilot-projects',
    tags: ['Pilot Projects', 'Chitral', 'Teacher Training', 'Jolly Learning UK'],
    location: 'Chitral',
    city: 'Chitral',
    country: 'Pakistan',
    dateDisplay: 'Fall 2025',
    dateStart: '2025-10-01',
    sortDate: '2025-10-01T00:00:00.000Z',
    trainer: 'Tahira Sheikh',
    organizer: 'Jolly Learning UK',
    format: 'Pilot Project',
    galleryFolder: 'chitral-pilot-project-training-2025',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Chitral Pilot Project Phonics Training | Fall 2025',
    seoDescription: 'Pilot-project teacher training was conducted in Chitral by Tahira Sheikh during Fall 2025, organized by Jolly Learning UK to strengthen literacy teaching.',
    body: [
      'A professional teacher-training programme was conducted in **Chitral during Fall 2025** as part of a pilot-project initiative organized by **Jolly Learning UK**.',
      "The training was conducted by **Tahira Sheikh** and focused on strengthening educators' knowledge and practical application of systematic phonics-based literacy instruction.",
      'Working with educators in Chitral provided an important opportunity to extend professional literacy development to teachers working in the region and support them with structured approaches to early reading and writing.',
      'Participants explored the progression of essential literacy skills, including sound recognition, blending for reading and segmenting for spelling, together with practical approaches for engaging children in active and multisensory learning.',
      "The training emphasized the role of teachers in establishing strong literacy foundations. When educators understand both the methodology and the progression behind effective phonics instruction, they are better equipped to respond to learners' needs and support children towards greater independence in reading and writing.",
      'The Chitral programme formed part of a wider commitment to strengthening literacy education through teacher capacity building and practical classroom implementation.',
    ],
  },
  {
    id: 'event-soar-school-system-2024',
    slug: 'teaching-english-through-jolly-phonics-soar-school-system-2024',
    title: 'Teaching English Through Jolly Phonics - Professional Training at SOAR School System',
    excerpt: 'Phonics Club organized a Teaching English Through Jolly Phonics training at SOAR School System in August 2024, conducted by Dr. Fatima Tuz Zahra.',
    category: 'jolly-phonics',
    tags: ['Jolly Phonics', 'Teacher Training', 'Professional Development', 'SOAR School System'],
    location: 'SOAR School System',
    venue: 'SOAR School System',
    country: 'Pakistan',
    dateDisplay: 'August 2024',
    dateStart: '2024-08-01',
    sortDate: '2024-08-01T00:00:00.000Z',
    trainer: 'Dr. Fatima Tuz Zahra',
    organizer: 'Phonics Club',
    galleryFolder: 'soar-school-system-2024',
    newsletterUrl: null,
    published: true,
    seoTitle: 'Teaching English Through Jolly Phonics at SOAR School System | Phonics Club',
    seoDescription: 'Dr. Fatima Tuz Zahra conducted a professional Teaching English Through Jolly Phonics training at SOAR School System in August 2024, organized by Phonics Club.',
    body: [
      'Phonics Club organized a professional training programme on Teaching English Through Jolly Phonics at SOAR School System in August 2024.',
      'The session was conducted by Dr. Fatima Tuz Zahra and focused on helping educators develop a clear understanding of the Jolly Phonics approach and its practical application in English language and literacy classrooms.',
      'Participants explored how systematic phonics instruction can support children in developing strong foundations in sound recognition, blending, segmenting, spelling, reading and writing.',
      'The training emphasized the importance of multisensory learning and carefully sequenced teaching. Educators were introduced to practical strategies that can help make phonics instruction engaging, structured and accessible for young learners.',
      'A key focus of the programme was helping teachers translate methodology into everyday classroom practice. Participants considered how effective modelling, active participation and consistent progression can support children as they become increasingly confident and independent readers and writers.',
      "The session formed part of Phonics Club's ongoing commitment to strengthening literacy education through high-quality professional development and practical teacher support.",
    ],
  },
]

export const TRAINING_EVENT_ARTICLES: TrainingEventArticle[] = BASE_TRAINING_EVENT_ARTICLES.map((article) => ({
  ...article,
  ...(TRAINING_EVENT_NEWSLETTER_DETAILS[article.slug] ?? {}),
}))

export const PHOTO_FOLDERS_WAITING_FOR_IMAGES = TRAINING_EVENT_ARTICLES.map((article) => ({
  title: article.title,
  folder: `public/images/blog/${article.galleryFolder}`,
}))
