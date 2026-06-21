import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'
import type { BlogPost } from '@/types/database'

export function BlogPreviewGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold">From Our Blog</h2>
            <p className="text-muted-foreground mt-2">Phonics tips, teaching guides, and parent resources</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/blog">
              Read More <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-[#1D4ED8]/10 to-[#FBBF24]/20 flex items-center justify-center text-4xl">
                📝
              </div>
              <div className="p-6">
                <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                <h3 className="font-semibold text-lg group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                  <Calendar className="w-3.5 h-3.5" />
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
