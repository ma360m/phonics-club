import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GradientThumbnail, yearFromValue } from '@/components/blog/gradient-thumbnail'
import { formatDate } from '@/utils/format'
import type { BlogPost } from '@/types/database'

const BLOG_DESCRIPTION =
  "Discover practical tips, educational news, professional development articles, and evidence-based literacy practices to support every child's reading journey."

export function BlogPreviewGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold">From Our Blog</h2>
            <p className="mt-2 text-muted-foreground">{BLOG_DESCRIPTION}</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/blog">
              Read More <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:border-[#1D4ED8] hover:shadow-md"
            >
              <GradientThumbnail
                title={post.title}
                meta={formatDate(post.created_at)}
                year={yearFromValue(post.created_at)}
                className="aspect-video min-h-0"
                compact
                showText={false}
              />
              <div className="flex flex-1 flex-col p-6">
                <Badge variant="secondary" className="mb-3 capitalize">{post.category}</Badge>
                <h3 className="break-words text-lg font-semibold transition-colors group-hover:text-[#1D4ED8]">
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                ) : null}
                <p className="mt-auto flex items-center gap-1 pt-5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
