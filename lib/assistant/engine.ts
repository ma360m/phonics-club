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
  'Training dates',
  'Contact support',
  'My enrolled courses',
  'Payment methods',
]

export { STARTER_SUGGESTIONS }

function matchCourses(courses: Course[], q: string): Course[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  return courses.filter((c) => {
    const hay = `${c.title} ${c.description} ${c.category} ${c.instructor} ${c.level}`.toLowerCase()
    return terms.some((t) => hay.includes(t))
  })
}

function matchProducts(products: Product[], q: string): Product[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  return products.filter((p) => {
    const cat = PRODUCT_CATEGORY_LABELS[p.category] ?? p.category
    const hay = `${p.name} ${p.description} ${cat} ${p.isbn ?? ''}`.toLowerCase()
    return terms.some((t) => hay.includes(t))
  })
}

function formatCourseList(courses: Course[]): string {
  if (!courses.length) return 'No matching courses found. Visit /courses to browse all programs.'
  return courses
    .slice(0, 5)
    .map(
      (c) =>
        `• **${c.title}** — ${c.price === 0 ? 'Free' : formatPrice(c.price)} | ${c.level} | ${c.duration ?? 'Self-paced'}\n  /courses/${c.slug}`
    )
    .join('\n')
}

function formatProductList(products: Product[]): string {
  if (!products.length) return 'No matching products. Visit /shop to browse our catalog.'
  return products
    .slice(0, 5)
    .map((p) => `• **${p.name}** — ${formatPrice(p.price)} | ${PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}\n  /shop/${p.slug}`)
    .join('\n')
}

export function generateAssistantReply(input: string, ctx: AssistantContext): string {
  const q = input.toLowerCase().trim()
  const { courses, products, posts, enrolledCourseTitles, userName } = ctx
  const greeting = userName ? `Hi ${userName}! ` : ''

  // Personalized enrolled courses
  if (
    (q.includes('my course') || q.includes('enrolled') || q.includes('my progress')) &&
    enrolledCourseTitles?.length
  ) {
    return `${greeting}You are enrolled in:\n${enrolledCourseTitles.map((t) => `• ${t}`).join('\n')}\n\nContinue learning at /dashboard/my-courses`
  }

  if (q.includes('my course') || q.includes('enrolled')) {
    return `${greeting}You are not enrolled in any courses yet. Browse /courses and click Enroll to get started!`
  }

  // Course discovery
  if (
    q.includes('course') ||
    q.includes('learn') ||
    q.includes('training') ||
    q.includes('phonics') ||
    q.includes('preschool') ||
    q.includes('jolly') ||
    q.includes('enroll')
  ) {
    const keywords = q.replace(/course|courses|learn|training|enroll|what|do|you|offer|show|me/g, '').trim()
    const matched = keywords.length > 2 ? matchCourses(courses, keywords) : courses.slice(0, 5)

    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
      const course = matchCourses(courses, q)[0] ?? courses[0]
      if (course) {
        const modules = course.curriculum?.length ?? 0
        const lessons = course.curriculum?.reduce((n, m) => n + m.lessons.length, 0) ?? 0
        return `${course.title} costs ${course.price === 0 ? 'FREE' : formatPrice(course.price)}.\n\nIncludes:\n• ${lessons} lessons across ${modules} modules\n• Instructor: ${course.instructor ?? 'Certified trainer'}\n• Duration: ${course.duration ?? 'Self-paced'}\n• Certificate on completion\n\nEnroll: /courses/${course.slug}`
      }
    }

    if (q.includes('recommend') || q.includes('beginner') || q.includes('best for')) {
      const beginner = courses.filter((c) => c.level === 'beginner' || c.price === 0)
      return `${greeting}For beginners I recommend:\n\n${formatCourseList(beginner.length ? beginner : courses.slice(0, 3))}\n\nTell me your goal (teaching, parenting, preschool) for a tailored recommendation.`
    }

    return `${greeting}Here are our courses:\n\n${formatCourseList(matched)}\n\nAsk "How much is [course name]?" for pricing details.`
  }

  // Products
  if (
    q.includes('product') ||
    q.includes('book') ||
    q.includes('kit') ||
    q.includes('shop') ||
    q.includes('buy') ||
    q.includes('price') ||
    q.includes('isbn') ||
    q.includes('reader') ||
    q.includes('workbook') ||
    q.includes('pupil')
  ) {
    const keywords = q.replace(/product|products|book|books|shop|buy|price|show/g, '').trim()
    const matched = keywords.length > 2 ? matchProducts(products, keywords) : products.filter((p) => p.featured).slice(0, 5)

    if (q.includes('beginner') || q.includes('start') || q.includes('recommend')) {
      const kits = matchProducts(products, 'kit pupil workbook')
      return `${greeting}For beginners starting Jolly Phonics:\n\n${formatProductList(kits.length ? kits : products.slice(0, 4))}\n\nAdd to cart at /shop or ask about bundle pricing on WhatsApp.`
    }

    return `${greeting}Our products (PKR):\n\n${formatProductList(matched.length ? matched : products.slice(0, 5))}\n\nAll prices in PKR. Bulk orders: WhatsApp ${COMPANY.phoneDisplay}`
  }

  // Blog
  if (q.includes('blog') || q.includes('article') || q.includes('news') || q.includes('noc') || q.includes('pctb')) {
    const post = posts[0]
    if (post) {
      return `Latest: **${post.title}**\n${post.excerpt}\n\nRead more: /blog/${post.slug}`
    }
    return 'Visit /blog for phonics tips, teaching guides, and news.'
  }

  // Payment
  if (q.includes('payment') || q.includes('jazzcash') || q.includes('easypaisa') || q.includes('bank') || q.includes('pay')) {
    return `Payment methods:\n• Bank transfer\n• JazzCash\n• EasyPaisa\n• Card payment (at checkout)\n\nFor payment instructions, contact:\n📧 ${COMPANY.adminEmail}\n📱 ${COMPANY.phoneDisplay} or ${COMPANY.phoneAltDisplay}\n\nWhatsApp us for invoice details.`
  }

  // Cart / checkout
  if (q.includes('cart') || q.includes('checkout') || q.includes('order')) {
    return `To purchase:\n1. Browse /shop or /courses\n2. Add items to cart\n3. Checkout at /checkout\n\nApply coupon codes at checkout. Order status visible in /dashboard.`
  }

  // Certificate
  if (q.includes('certificate') || q.includes('certified')) {
    return `Certificates are issued after completing a course (100% progress). View yours at /dashboard/my-courses.\n\nWe also have certified trainers: /certified-trainers`
  }

  // Contact
  if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('whatsapp') || q.includes('location') || q.includes('address')) {
    return `Contact Phonics Club:\n📧 ${COMPANY.adminEmail}\n📧 ${COMPANY.email}\n📱 ${COMPANY.phoneDisplay}\n📱 ${COMPANY.phoneAltDisplay}\n📍 ${COMPANY.address}\n\nWhatsApp: ${COMPANY.phoneDisplay}\n/contact for the full form.`
  }

  // Training calendar
  if (q.includes('webinar') || q.includes('onsite') || q.includes('calendar') || q.includes('date')) {
    return `2025 Training Calendar:\n• Jolly Phonics — Feb 15 & Aug 2 (onsite)\n• Jolly Grammar — Feb 22 & Aug 9 (onsite)\n• Online webinars — Mar 1 & Mar 8\n\nRegister at /trainings or email ${COMPANY.adminEmail}`
  }

  // Tutor mode
  if (q.includes('explain') || q.includes('practice') || q.includes('test me') || q.includes('summarize') || q.includes('example')) {
    return `AI Tutor Mode 🎓\n\nI can help explain phonics concepts! Try asking:\n• "Explain synthetic phonics"\n• "Give examples of blending"\n• "What are tricky words?"\n\nFor full lesson content, enroll in a course and use the learning player at /dashboard/my-courses.`
  }

  if (q.includes('synthetic phonics') || q.includes('what is phonics')) {
    return `Synthetic Phonics teaches children letter sounds first, then blending to read words. The Jolly Phonics program uses actions, stories, and songs for each sound (s,a,t,i,p,n first).\n\nRecommended: Teaching of English through Jolly Phonics course at /courses/teaching-english-jolly-phonics`
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('help')) {
    return `${greeting}I'm your PHONICS CLUB AI Assistant — Course Advisor, Product Guide & Support Agent.\n\nI can help with:\n• Finding courses & products\n• Pricing & enrollment\n• Training dates\n• Payment methods\n• Your progress (when logged in)\n\nTry: "Find a course" or "Show pupil books"`
  }

  // Sales funnel
  if (q.includes('looking for') || q.includes('corporate') || q.includes('kids')) {
    return `What are you looking for?\n\n1️⃣ **Learn a skill** → /courses\n2️⃣ **Buy products** → /shop\n3️⃣ **Corporate training** → /trainings\n4️⃣ **Kids programs** → Preschool Professional course\n5️⃣ **Professional certification** → Jolly Phonics Intensive\n\nTell me more about your needs!`
  }

  return `${greeting}I can help you find courses, products, training dates, pricing, and support.\n\nTry:\n• "What courses do you offer?"\n• "Show pupil books"\n• "Training dates 2025"\n• "Payment methods"\n\nOr contact us: ${COMPANY.phoneDisplay}`
}
