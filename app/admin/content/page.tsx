import { getAllSiteContent } from '@/lib/site-content'
import { saveSiteContentFormAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const SECTIONS = [
  { key: 'announcements', label: 'Announcement Ticker / Flyers', hint: 'Array of {id, message, linkUrl, linkText, couponCode, active}' },
  { key: 'testimonials', label: 'Homepage Testimonials', hint: 'Array of {id, content, author, role, rating}' },
  { key: 'social_reels', label: 'Social Community Reels', hint: 'Array of {id, thumbnail, videoUrl, title}' },
  { key: 'vortex_learning', label: 'Vortex Learning Partnership', hint: 'Object with title, description, websiteUrl, courses[]' },
  { key: 'invoice_template', label: 'Invoice Template', hint: 'Object with header, tagline, footer' },
  { key: 'bank_details', label: 'Bank Details (Checkout)', hint: 'Object with bankName, accountTitle, accountNumber, iban, instructions' },
]

export default async function AdminContentPage() {
  const allContent = await getAllSiteContent()
  const contentMap = Object.fromEntries(allContent.map((c: { key: string; content: unknown }) => [c.key, c.content]))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Site Content</h1>
      <p className="text-muted-foreground mb-8">Manage homepage announcements, testimonials, social reels, Vortex Learning, and invoice settings.</p>

      <div className="space-y-8 max-w-4xl">
        {SECTIONS.map(({ key, label, hint }) => (
          <form key={key} action={saveSiteContentFormAction} className="bg-card rounded-2xl border p-6 space-y-3">
            <input type="hidden" name="key" value={key} />
            <Label className="text-lg font-semibold">{label}</Label>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <Textarea
              name="content"
              rows={8}
              className="rounded-xl font-mono text-xs"
              defaultValue={JSON.stringify(contentMap[key] ?? [], null, 2)}
            />
            <Button type="submit" className="rounded-xl bg-[#1D4ED8]">Save {label}</Button>
          </form>
        ))}
      </div>
    </div>
  )
}
