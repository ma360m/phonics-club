import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { getProducts, getCourses, getBlogPosts } from '@/lib/data/queries'
import { getUserEnrollments } from '@/actions/enrollments'
import { generateAssistantReply } from '@/lib/assistant/engine'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const profile = await getProfile()
    const [courses, products, posts] = await Promise.all([
      getCourses(),
      getProducts({ limit: 50 }),
      getBlogPosts({ limit: 5 }),
    ])

    let enrolledCourseTitles: string[] | undefined
    if (profile) {
      const enrollments = await getUserEnrollments().catch(() => [])
      enrolledCourseTitles = enrollments.map((e) => {
        const c = e.courses as { title: string } | undefined
        return c?.title ?? 'Course'
      })
    }

    const reply = generateAssistantReply(message, {
      courses,
      products,
      posts,
      enrolledCourseTitles,
      userName: profile?.full_name ?? undefined,
    })

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Assistant error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Assistant unavailable' },
      { status: 500 }
    )
  }
}
