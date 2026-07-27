import type { Course, Product, BlogPost } from '@/types/database'
import { COMPANY } from '@/lib/company'
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { formatPrice } from '@/utils/format'

export interface AssistantContext {
  courses: Course[]
  products: Product[]
  posts: BlogPost[]
  enrolledCourseTitles?: string[]
  userName?: string
}

const STARTER_SUGGESTIONS = [
  'Find a course',
  'Browse products',
  'Vortex Learning',
  'Payment methods',
  'Course refund policy',
  'Contact support',
]

export { STARTER_SUGGESTIONS }

const CONTACT_REPLY = `For account-specific or complex questions, please contact Phonics Club:\n- ${COMPANY.email}\n- ${COMPANY.adminEmail}\n- ${COMPANY.phoneDisplay}\n- ${COMPANY.phoneAltDisplay}\n- /contact`

function words(q: string) {
  return q.toLowerCase().split(/\s+/).filter(Boolean)
}

function includesAny(q: string, terms: string[]) {
  return terms.some((term) => q.includes(term))
}

function matchCourses(courses: Course[], q: string): Course[] {
  const terms = words(q)
  return courses.filter((c) => {
    const hay = `${c.title} ${c.description} ${c.category} ${c.instructor} ${c.level} ${c.duration}`.toLowerCase()
    return terms.some((term) => hay.includes(term))
  })
}

function matchProducts(products: Product[], q: string): Product[] {
  const terms = words(q)
  return products.filter((p) => {
    const cat = PRODUCT_CATEGORY_LABELS[p.category] ?? p.category
    const hay = `${p.name} ${p.description} ${cat} ${p.isbn ?? ''}`.toLowerCase()
    return terms.some((term) => hay.includes(term))
  })
}

function formatCourseList(courses: Course[]): string {
  if (!courses.length) return `No matching courses found. Browse all programs at /courses.\n\n${CONTACT_REPLY}`
  return courses
    .slice(0, 5)
    .map(
      (c) =>
        `- **${c.title}**: ${c.price === 0 ? 'Free' : formatPrice(c.price)} | ${c.level} | ${c.duration ?? 'Self-paced'}\n  /courses/${c.slug}`
    )
    .join('\n')
}

function formatProductList(products: Product[]): string {
  if (!products.length) return `No matching products found. Browse the catalog at /shop.\n\n${CONTACT_REPLY}`
  return products
    .slice(0, 5)
    .map((p) => `- **${p.name}**: ${formatPrice(p.price)} | ${PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}\n  /shop/${p.slug}`)
    .join('\n')
}

function coursePolicyReply() {
  return `Classroom course cancellation policy:\n- Cancel 15 or more working days before the course start date: 30% admin fee applies, remaining eligible deposit may be refunded.\n- Cancellation less than 15 working days before the course start date: no refund.\n- If Phonics Club cancels a course because minimum delegates are not reached or a safe training environment is not possible, management may arrange an alternative date or offer a 70% refund.\n- Once login details, online access, course outlines, or live training access have been issued, refunds cannot be granted.\n- Postponement requests must be made at least 5 working days before the course starts.\n\nRefund requests: info@phonicsclub.com`
}

function paymentReply() {
  return `Payment options:\n- Cash on Delivery\n- Bank Transfer: MEEZAN BANK, Phonics Club PVT. LTD, A/C No: 02590104584267\n\nAfter bank transfer, upload or share your receipt as requested. Having issue with payment? Contact 0308 4432015, 0300 8079480, or ${COMPANY.email}.`
}

export function generateAssistantReply(input: string, ctx: AssistantContext): string {
  const q = input.toLowerCase().trim()
  const { courses, products, posts, enrolledCourseTitles, userName } = ctx
  const greeting = userName ? `Hi ${userName}! ` : ''

  if (!q) return `Please type your question and I will help.\n\n${CONTACT_REPLY}`

  if (includesAny(q, ['hello', 'hi', 'help', 'salam', 'assalam'])) {
    return `${greeting}I am your PHONICS CLUB AI Assistant. I can guide you through courses, products, trainer profiles, payments, refunds, research projects, Vortex Learning, certificates, orders, and support.\n\nTry asking "Which course should I start with?", "Payment methods", "What is Vortex Learning?", or "Show pupil books".`
  }

  if (includesAny(q, ['vortex', 'vortex learning'])) {
    return `Vortex Learning is a company focused on providing students with different courses and online classes all over the world.\n\nPhonics Club presents Vortex Learning as an online education partner for students and educators who want flexible access to learning support.\n\nExplore related programs at /courses or contact us for guidance.`
  }

  if (
    (includesAny(q, ['my course', 'enrolled', 'my progress']) || q === 'my enrolled courses') &&
    enrolledCourseTitles?.length
  ) {
    return `${greeting}You are enrolled in:\n${enrolledCourseTitles.map((title) => `- ${title}`).join('\n')}\n\nContinue learning at /dashboard/my-courses`
  }

  if (includesAny(q, ['my course', 'enrolled', 'my progress'])) {
    return `${greeting}I do not see enrolled courses for this session. Browse /courses and enroll, or sign in and check /dashboard/my-courses.\n\n${CONTACT_REPLY}`
  }

  if (includesAny(q, ['refund', 'cancel course', 'course cancel', 'postpone', 'postponement', 'cancellation'])) {
    return coursePolicyReply()
  }

  if (includesAny(q, ['payment', 'jazzcash', 'easypaisa', 'bank', 'pay', 'iban', 'account number'])) {
    return paymentReply()
  }

  if (
    includesAny(q, [
      'course',
      'learn',
      'training',
      'phonics',
      'preschool',
      'jolly',
      'enroll',
      'teacher',
      'online class',
      'class',
    ])
  ) {
    const keywords = q.replace(/course|courses|learn|training|enroll|what|do|you|offer|show|me|class|classes/g, '').trim()
    const matched = keywords.length > 2 ? matchCourses(courses, keywords) : courses.slice(0, 5)

    if (includesAny(q, ['price', 'cost', 'how much', 'fee'])) {
      const course = matchCourses(courses, q)[0] ?? courses[0]
      if (course) {
        const modules = course.curriculum?.length ?? 0
        const lessons = course.curriculum?.reduce((count, module) => count + module.lessons.length, 0) ?? 0
        return `${course.title} costs ${course.price === 0 ? 'FREE' : formatPrice(course.price)}.\n\nIncludes:\n- ${lessons} lessons across ${modules} modules\n- Instructor: ${course.instructor ?? 'Certified trainer'}\n- Duration: ${course.duration ?? 'Self-paced'}\n- Certificate on completion\n\nEnroll: /courses/${course.slug}`
      }
    }

    if (includesAny(q, ['recommend', 'beginner', 'best for', 'start'])) {
      const beginner = courses.filter((c) => c.level === 'beginner' || c.price === 0)
      return `${greeting}For beginners, I recommend starting with:\n\n${formatCourseList(beginner.length ? beginner : courses.slice(0, 3))}\n\nTell me whether you are a teacher, parent, school leader, or student for a more tailored recommendation.`
    }

    return `${greeting}Here are relevant courses:\n\n${formatCourseList(matched)}\n\nFor custom school training or course selection help, contact /contact.`
  }

  if (
    includesAny(q, [
      'product',
      'book',
      'kit',
      'shop',
      'buy',
      'price',
      'isbn',
      'reader',
      'workbook',
      'pupil',
      'grammar',
      'resource',
    ])
  ) {
    const keywords = q.replace(/product|products|book|books|shop|buy|price|show|resource|resources/g, '').trim()
    const matched = keywords.length > 2 ? matchProducts(products, keywords) : products.filter((p) => p.featured).slice(0, 5)

    if (includesAny(q, ['beginner', 'start', 'recommend'])) {
      const kits = matchProducts(products, 'kit pupil workbook readers')
      return `${greeting}For beginners starting Jolly Phonics, look at pupil books, workbooks, readers, and classroom kits:\n\n${formatProductList(kits.length ? kits : products.slice(0, 4))}\n\nFor bundle support, WhatsApp ${COMPANY.phoneDisplay}.`
    }

    return `${greeting}Relevant products:\n\n${formatProductList(matched.length ? matched : products.slice(0, 5))}\n\nAll prices are in PKR. Bulk orders and school purchases can be discussed on WhatsApp ${COMPANY.phoneDisplay}.`
  }

  if (includesAny(q, ['order', 'cart', 'checkout', 'shipping', 'delivery'])) {
    return `To purchase:\n1. Browse /shop or /courses\n2. Add items to cart\n3. Checkout at /checkout\n4. Upload receipt if paying by bank transfer\n\nShipping is added at checkout and may be adjusted by admin based on quantity, distance, and product weight. Order questions should go to ${COMPANY.email} with your invoice or order number.`
  }

  if (includesAny(q, ['certificate', 'certified trainer', 'trainer', 'instructor'])) {
    return `Certificates are issued after completing eligible course requirements. View your learning dashboard at /dashboard/my-courses.\n\nCertified trainer profiles are available at /certified-trainers. For trainer-led school support, contact /contact.`
  }

  if (includesAny(q, ['research', 'pilot', 'study', 'project', 'aser', 'jolly learning'])) {
    return `Phonics Club research and pilot work includes Synthetic Phonics implementation projects, estate school trials, literacy standards work, and ongoing 2025-2026 multi-city implementation in Lahore, Chitral, Gujranwala, Skardu, and Karachi.\n\nRead more at /research.`
  }

  if (includesAny(q, ['about', 'mission', 'vision', 'who are you', 'phonics club'])) {
    return `Phonics Club Pvt. Ltd. is a registered organization dedicated to promoting Synthetic Phonics. Founded in 2015, it supports teachers, schools, parents, and learners through training, consultancy, curriculum development, literacy assessments, learning resources, and professional development.\n\nRead more at /about.`
  }

  if (includesAny(q, ['blog', 'article', 'news', 'noc', 'pctb'])) {
    const post = posts[0]
    if (post) {
      return `Latest article: **${post.title}**\n${post.excerpt ?? ''}\n\nRead more: /blog/${post.slug}`
    }
    return 'Visit /blog for phonics tips, teaching guides, NOC updates, PCTB information, and company news.'
  }

  if (includesAny(q, ['contact', 'email', 'phone', 'whatsapp', 'location', 'address', 'support'])) {
    return CONTACT_REPLY
  }

  if (includesAny(q, ['synthetic phonics', 'what is phonics', 'blending', 'segmenting', 'tricky words'])) {
    return `Synthetic Phonics teaches children letter sounds first, then blending sounds to read words and segmenting sounds to spell. Jolly Phonics supports this through actions, stories, songs, readers, spelling, grammar, and structured classroom routines.\n\nFor full training, explore /courses or contact Phonics Club.`
  }

  return `${greeting}I can help with courses, products, payments, refunds, orders, certificates, trainer profiles, research, Vortex Learning, and Phonics Club information.\n\nI do not want to guess on this question. ${CONTACT_REPLY}`
}
