import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { getBlogPosts } from '@/lib/data/queries'
import { buildMetadata } from '@/utils/seo'
import { formatDate } from '@/utils/format'
import { BLOG_CATEGORIES } from '@/lib/constants'
import { GradientThumbnail, yearFromValue } from '@/components/blog/gradient-thumbnail'

const BLOG_DESCRIPTION =
  "Discover practical tips, educational news, professional development articles, and evidence-based literacy practices to support every child's reading journey."

export const metadata = buildMetadata({
  title: 'Blog',
  description: BLOG_DESCRIPTION,
  path: '/blog',
})

function postTime(value: string | Date | null | undefined) {
  const time = new Date(value ?? '').getTime()
  return Number.isFinite(time) ? time : 0
}

function postYear(value: string | Date | null | undefined) {
  const year = new Date(value ?? '').getFullYear()
  return Number.isFinite(year) ? String(year) : 'Undated'
}

function hasUsableCover(post: { cover_image?: string | null; slug: string }) {
  return Boolean(post.cover_image && post.cover_image !== '/logo.png' && post.slug !== 'jolly-phonics-2017-training-video')
}

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
  const sortedPosts = [...posts].sort((a, b) => postTime(b.created_at) - postTime(a.created_at))
  const groupedPosts = sortedPosts.reduce<Record<string, typeof sortedPosts>>((acc, post) => {
    const year = postYear(post.created_at)
    acc[year] = acc[year] ?? []
    acc[year].push(post)
    return acc
  }, {})
  const years = Object.keys(groupedPosts).sort((a, b) => {
    if (a === 'Undated') return 1
    if (b === 'Undated') return -1
    return Number(b) - Number(a)
  })

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto w-full max-w-none px-6 py-12 sm:px-8 lg:px-10">
        <div className="mb-8 max-w-5xl">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">{BLOG_DESCRIPTION}</p>
        </div>
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
        {years.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="font-semibold">No blog posts found.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {years.map((year) => (
              <section key={year}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-[#1D4ED8]">Articles</p>
                    <h2 className="text-3xl font-bold text-[#0F172A]">{year}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{groupedPosts[year].length} post{groupedPosts[year].length === 1 ? '' : 's'}</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {groupedPosts[year].map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-[#1D4ED8] hover:shadow-md"
                    >
                      {hasUsableCover(post) ? (
                        <img src={post.cover_image!} alt="" className="aspect-video w-full object-cover" />
                      ) : (
                        <GradientThumbnail title={post.title} meta={formatDate(post.created_at)} year={yearFromValue(post.created_at)} className="aspect-video min-h-0" compact showText={false} />
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <Badge variant="secondary" className="mb-2 capitalize">{post.category}</Badge>
                        <h3 className="break-words text-lg font-semibold leading-tight group-hover:text-[#1D4ED8]">{post.title}</h3>
                        {post.excerpt && <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{post.excerpt}</p>}
                        <p className="mt-auto pt-5 text-xs font-medium text-muted-foreground">{formatDate(post.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
