import Link from 'next/link'
import { getAdminBlogPosts } from '@/actions/admin/blog'
import { uploadNewsletterFormAction, deleteNewsletterFormAction, updateNewsletterFormAction } from '@/actions/admin/newsletters'
import { NEWSLETTER_MAX_FILE_SIZE_MB, listNewsletterIssues, formatNewsletterMonth } from '@/lib/newsletters'
import { eventCategoryLabel, TRAINING_EVENT_ARTICLES } from '@/lib/data/training-events-blog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, Eye, FileText, Pencil, Save, Trash2 } from 'lucide-react'
import type { BlogPost } from '@/types/database'

const months = Array.from({ length: 12 }, (_, index) => index + 1)
const currentYear = new Date().getFullYear()
const newsletterArticleSlugs = new Set(TRAINING_EVENT_ARTICLES.filter((article) => article.published).map((article) => article.slug))
const newsletterArticlesBySlug = new Map(TRAINING_EVENT_ARTICLES.map((article) => [article.slug, article]))

export const dynamic = 'force-dynamic'

function formatPostDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date'
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getNewsletterArticlePdfUrl(post: BlogPost) {
  const sourceArticle = newsletterArticlesBySlug.get(post.slug)
  return sourceArticle?.newsletterUrl || `/api/site/announcements?newsletterPdf=${encodeURIComponent(post.slug)}`
}

export default async function AdminNewslettersPage() {
  const [newsletters, blogPosts] = await Promise.all([
    listNewsletterIssues({ admin: true }),
    getAdminBlogPosts(),
  ])
  const articleNewsletters = blogPosts.filter((post) => newsletterArticleSlugs.has(post.slug))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Archive</h1>
          <p className="text-muted-foreground">
            Manage newsletter articles and uploaded PDF newsletters.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Article newsletters</CardTitle>
            <Badge variant="secondary">{articleNewsletters.length} visible</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {articleNewsletters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No article newsletters are available to edit yet.</p>
          ) : (
            articleNewsletters.map((post) => (
              <div key={post.id} className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#1D4ED8] text-white">{eventCategoryLabel(post.category)}</Badge>
                    <Badge variant={post.published ? 'default' : 'outline'}>
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">{formatPostDate(post.created_at)}</span>
                  </div>
                  <h2 className="truncate text-lg font-semibold">{post.title}</h2>
                  {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/blog/${post.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={getNewsletterArticlePdfUrl(post)} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </a>
                  </Button>
                  <Button asChild size="sm" className="bg-[#1D4ED8]">
                    <Link href={`/admin/blog/${post.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload PDF newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadNewsletterFormAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-2 text-sm sm:col-span-2">
              <Label htmlFor="newsletter-upload-title">Title</Label>
              <Input id="newsletter-upload-title" name="title" placeholder="July 2026 Newsletter" className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="newsletter-upload-month">Month</Label>
              <select id="newsletter-upload-month" name="month" defaultValue={new Date().getMonth() + 1} className="h-9 rounded-xl border bg-background px-3 py-2 text-sm">
                {months.map((month) => (
                  <option key={month} value={month}>
                    {formatNewsletterMonth(month)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="newsletter-upload-year">Year</Label>
              <Input id="newsletter-upload-year" name="year" type="number" min="2000" max="2100" defaultValue={currentYear} required className="rounded-xl" />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input name="published" type="checkbox" defaultChecked />
              Published
            </label>
            <label className="flex flex-col gap-2 text-sm sm:col-span-3">
              <span className="font-medium">PDF file</span>
              <input name="file" type="file" accept=".pdf" required className="rounded-xl border bg-background px-3 py-2" />
              <span className="text-xs text-muted-foreground">PDF only, up to {NEWSLETTER_MAX_FILE_SIZE_MB} MB.</span>
            </label>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
                <FileText className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Uploaded PDF newsletters</CardTitle>
            <Badge variant="secondary">{newsletters.length} uploaded</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {newsletters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PDF newsletters uploaded yet.</p>
          ) : (
            newsletters.map((issue) => (
              <div key={issue.id} className="rounded-lg border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{issue.title}</p>
                      <Badge variant={issue.published ? 'default' : 'outline'}>
                        {issue.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNewsletterMonth(issue.month)} {issue.year} - {(issue.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={issue.file_url} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        View PDF
                      </a>
                    </Button>
                    <form action={deleteNewsletterFormAction}>
                      <input type="hidden" name="id" value={issue.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>

                <form action={updateNewsletterFormAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_140px_auto_auto] lg:items-end">
                  <input type="hidden" name="id" value={issue.id} />
                  <div className="grid gap-2">
                    <Label htmlFor={`newsletter-title-${issue.id}`}>Title</Label>
                    <Input id={`newsletter-title-${issue.id}`} name="title" defaultValue={issue.title} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`newsletter-month-${issue.id}`}>Month</Label>
                    <select id={`newsletter-month-${issue.id}`} name="month" defaultValue={issue.month} className="h-9 rounded-xl border bg-background px-3 py-2 text-sm">
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {formatNewsletterMonth(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`newsletter-year-${issue.id}`}>Year</Label>
                    <Input id={`newsletter-year-${issue.id}`} name="year" type="number" min="2000" max="2100" defaultValue={issue.year} required className="rounded-xl" />
                  </div>
                  <label className="flex h-9 items-center gap-2 text-sm">
                    <input name="published" type="checkbox" defaultChecked={issue.published} />
                    Published
                  </label>
                  <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
