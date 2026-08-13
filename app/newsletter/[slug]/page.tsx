import { notFound, redirect } from 'next/navigation'
import { TRAINING_EVENT_ARTICLES } from '@/lib/data/training-events-blog'

const NEWSLETTER_SLUG_ALIASES: Record<string, string> = {
  'lahore-american-school-training-november-2024': 'lahore-american-school-phonics-training-2024',
}

export default async function NewsletterArticleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const targetSlug = NEWSLETTER_SLUG_ALIASES[slug] ?? slug
  const article = TRAINING_EVENT_ARTICLES.find((item) => item.published && item.slug === targetSlug)

  if (!article) notFound()
  redirect(`/blog/${article.slug}`)
}
