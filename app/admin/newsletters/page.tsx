import Link from 'next/link'
import { uploadNewsletterFormAction, deleteNewsletterFormAction } from '@/actions/admin/newsletters'
import { NEWSLETTER_MAX_FILE_SIZE_MB, listNewsletterIssues, formatNewsletterMonth } from '@/lib/newsletters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'

const months = Array.from({ length: 12 }, (_, index) => index + 1)
const currentYear = new Date().getFullYear()

export const dynamic = 'force-dynamic'

export default async function AdminNewslettersPage() {
  const newsletters = await listNewsletterIssues({ admin: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Archive</h1>
          <p className="text-muted-foreground">
            Upload old newsletters by month and year for customers to view.
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
          <CardTitle>Upload newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadNewsletterFormAction} encType="multipart/form-data" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium">Title</span>
              <input name="title" placeholder="July 2026 Newsletter" className="rounded-xl border bg-background px-3 py-2" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Month</span>
              <select name="month" defaultValue={new Date().getMonth() + 1} className="rounded-xl border bg-background px-3 py-2">
                {months.map((month) => (
                  <option key={month} value={month}>
                    {formatNewsletterMonth(month)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Year</span>
              <input name="year" type="number" min="2000" max="2100" defaultValue={currentYear} required className="rounded-xl border bg-background px-3 py-2" />
            </label>
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
              <Button type="submit" className="rounded-xl bg-[#1D4ED8]">Upload newsletter</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded newsletters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {newsletters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No newsletters uploaded yet.</p>
          ) : (
            newsletters.map((issue) => (
              <div key={issue.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
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
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={issue.file_url} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      View
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
