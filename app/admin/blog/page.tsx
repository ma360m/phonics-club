import Link from 'next/link'
import { getAdminBlogPosts, deleteBlogPostAction } from '@/actions/admin/blog'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href="/admin/blog/new"><Plus className="w-4 h-4 mr-2" /> New Post</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-card rounded-2xl border p-4">
            <div>
              <p className="font-semibold">{p.title}</p>
              <Badge variant={p.published ? 'default' : 'secondary'} className="mt-1">
                {p.published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link href={`/admin/blog/${p.id}`}><Pencil className="w-3.5 h-3.5" /></Link>
              </Button>
              <form action={deleteBlogPostAction.bind(null, p.id)}>
                <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
