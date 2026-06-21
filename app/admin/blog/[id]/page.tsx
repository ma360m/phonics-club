import { notFound } from 'next/navigation'
import { getAdminBlogPost } from '@/actions/admin/blog'
import { BlogForm } from '@/components/admin/blog-form'

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getAdminBlogPost(id)
  if (!post) notFound()
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
      <BlogForm post={post} />
    </div>
  )
}
