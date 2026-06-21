import { notFound } from 'next/navigation'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { getBlogPostBySlug } from '@/lib/data/queries'
import { buildMetadata, articleJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}
  return buildMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    image: post.cover_image ?? undefined,
    type: 'article',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <main>
      <JsonLd data={articleJsonLd(post)} />
      <AnnouncementBar />
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Badge className="mb-4">{post.category}</Badge>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-muted-foreground mb-8">{formatDate(post.created_at)}</p>
        {post.excerpt && <p className="text-xl text-muted-foreground mb-8 leading-relaxed">{post.excerpt}</p>}
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      </article>
      <Footer />
    </main>
  )
}
