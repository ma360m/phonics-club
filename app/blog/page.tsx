import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getBlogPosts } from '@/lib/data/queries'
import { buildMetadata } from '@/utils/seo'
import { formatDate } from '@/utils/format'
import { BLOG_CATEGORIES } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Blog',
  description: 'Phonics tips, teaching strategies, and literacy resources',
  path: '/blog',
})

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  let posts = await getBlogPosts({ category: category || undefined })
  if (q) {
    const term = q.toLowerCase()
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.excerpt?.toLowerCase().includes(term) ||
        p.tags?.some((t) => t.toLowerCase().includes(term))
    )
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-8">Insights for parents, teachers, and learners</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <a href="/blog" className={`px-4 py-2 rounded-xl text-sm font-medium ${!category ? 'bg-[#1D4ED8] text-white' : 'bg-muted'}`}>
            All
          </a>
          {BLOG_CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/blog?category=${cat}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${category === cat ? 'bg-[#1D4ED8] text-white' : 'bg-muted'}`}
            >
              {cat.replace('-', ' ')}
            </a>
          ))}
        </div>
        <form method="get" className="mb-10 flex gap-2 max-w-md">
          {category && <input type="hidden" name="category" value={category} />}
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search articles..."
            className="flex-1 rounded-xl border px-4 py-2 text-sm"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-sm font-medium">
            Search
          </button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-[#1D4ED8]/10 to-[#FBBF24]/20 flex items-center justify-center text-4xl">
                📝
              </div>
              <div className="p-6">
                <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                <h2 className="font-semibold text-lg group-hover:text-[#1D4ED8] line-clamp-2">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>}
                <p className="text-xs text-muted-foreground mt-4">{formatDate(post.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
