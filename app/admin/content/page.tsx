import {
  DEFAULT_ABOUT_PAGE,
  DEFAULT_POLICIES,
  DEFAULT_RESEARCH_PAGE,
  getAboutPageContent,
  getAllSiteContent,
  getHeroVideo,
  getBankDetails,
  getInvoiceTemplate,
  getPolicyContent,
  getResearchPageContent,
  getSchoolLogos,
  getSocialReels,
} from '@/lib/site-content'
import { saveSiteContentFormAction } from '@/actions/admin/site-content'
import { SchoolLogoManager } from '@/components/admin/school-logo-manager'
import { SocialReelsManager } from '@/components/admin/social-reels-manager'
import { SiteMediaUpload } from '@/components/admin/site-media-upload'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const SECTIONS = [
  { key: 'announcements', label: 'Announcement Ticker / Flyers', hint: 'Array of {id, message, linkUrl, linkText, couponCode, active}' },
  { key: 'testimonials', label: 'Homepage Testimonials', hint: 'Array of {id, content, author, role, rating, imageUrl}' },
  { key: 'hero_video', label: 'Homepage Videos', hint: 'Object with videoUrl for the embedded homepage video and demoButtonUrl for the Watch Demo button.' },
  { key: 'vortex_learning', label: 'Vortex Learning Partnership', hint: 'Object with title, description, websiteUrl, courses[]' },
  { key: 'about_page', label: 'About Us Page', hint: 'Structured About page content. Add supporting image URLs in supportImages[].' },
  { key: 'research_page', label: 'Research Page', hint: 'Structured Research page content. Add project images in projects[].images[] or supportImages[].' },
  { key: 'privacy_policy', label: 'Privacy Policy', hint: 'Policy content. lastUpdated is visible here for admin reference only, not on the public page.' },
  { key: 'terms_policy', label: 'Terms of Service', hint: 'Policy content. lastUpdated is visible here for admin reference only, not on the public page.' },
  { key: 'refunds_policy', label: 'Refund Policy', hint: 'Policy content. lastUpdated is visible here for admin reference only, not on the public page.' },
  { key: 'cookies_policy', label: 'Cookie Policy', hint: 'Policy content. lastUpdated is visible here for admin reference only, not on the public page.' },
  { key: 'invoice_template', label: 'Invoice Template', hint: 'Object with header, tagline, footer, bankDetails. Leave tagline empty to avoid an invoice subtitle.' },
  { key: 'bank_details', label: 'Bank Details (Checkout)', hint: 'Object with bankName, accountTitle, accountNumber, iban, instructions' },
]

export default async function AdminContentPage() {
  const [
    allContent,
    schoolLogos,
    heroVideo,
    socialReels,
    aboutPage,
    researchPage,
    privacyPolicy,
    termsPolicy,
    refundsPolicy,
    cookiesPolicy,
    invoiceTemplate,
    bankDetails,
  ] = await Promise.all([
    getAllSiteContent(),
    getSchoolLogos(),
    getHeroVideo(),
    getSocialReels(),
    getAboutPageContent(),
    getResearchPageContent(),
    getPolicyContent('privacy_policy'),
    getPolicyContent('terms_policy'),
    getPolicyContent('refunds_policy'),
    getPolicyContent('cookies_policy'),
    getInvoiceTemplate(),
    getBankDetails(),
  ])

  const contentMap = Object.fromEntries(allContent.map((c: { key: string; content: unknown }) => [c.key, c.content]))
  const defaults: Record<string, unknown> = {
    hero_video: heroVideo,
    social_reels: socialReels,
    about_page: aboutPage ?? DEFAULT_ABOUT_PAGE,
    research_page: researchPage ?? DEFAULT_RESEARCH_PAGE,
    privacy_policy: privacyPolicy ?? DEFAULT_POLICIES.privacy_policy,
    terms_policy: termsPolicy ?? DEFAULT_POLICIES.terms_policy,
    refunds_policy: refundsPolicy ?? DEFAULT_POLICIES.refunds_policy,
    cookies_policy: cookiesPolicy ?? DEFAULT_POLICIES.cookies_policy,
    invoice_template: invoiceTemplate,
    bank_details: bankDetails,
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Site Content</h1>
      <p className="mb-8 text-muted-foreground">
        Manage homepage announcements, testimonials, reels, Vortex Learning, About, Research, policies, invoice settings, and bank details.
      </p>

      <div className="max-w-4xl space-y-8">
        <SiteMediaUpload
          label="Upload supporting images or videos for About, Research, policies, or homepage sections"
          folder="site-content"
        />

        <SchoolLogoManager logos={schoolLogos} />
        <SocialReelsManager reels={socialReels} />

        {SECTIONS.map(({ key, label, hint }) => (
          <form key={key} action={saveSiteContentFormAction} className="space-y-3 rounded-lg border bg-card p-6">
            <input type="hidden" name="key" value={key} />
            <Label className="text-lg font-semibold">{label}</Label>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <Textarea
              name="content"
              rows={key.includes('policy') || key.includes('page') ? 16 : 8}
              className="rounded-lg font-mono text-xs"
              defaultValue={JSON.stringify(contentMap[key] ?? defaults[key] ?? [], null, 2)}
            />
            <Button type="submit" className="rounded-lg bg-[#1D4ED8]">Save {label}</Button>
          </form>
        ))}
      </div>
    </div>
  )
}
