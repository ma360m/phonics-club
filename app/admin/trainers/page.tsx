import { getAdminTrainers } from '@/actions/admin/trainers'
import { TrainersAdmin } from '@/components/admin/trainers-admin'
import { getBlogPosts } from '@/lib/data/queries'
import { getTrainerProfileAttachments } from '@/lib/site-content'
import type { Trainer } from '@/types/database'

export default async function AdminTrainersPage() {
  const [trainers, blogPosts, profileAttachments] = await Promise.all([
    getAdminTrainers().catch(() => []),
    getBlogPosts().catch(() => []),
    getTrainerProfileAttachments().catch(() => ({})),
  ])
  const articleOptions = blogPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    created_at: post.created_at,
  }))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Certified Trainers</h1>
      <p className="text-muted-foreground mb-8">Add, edit, or remove trainers shown on /certified-trainers</p>
      <TrainersAdmin trainers={trainers as Trainer[]} articleOptions={articleOptions} profileAttachments={profileAttachments} />
    </div>
  )
}
