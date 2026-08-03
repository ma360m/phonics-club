import {
  DEFAULT_ABOUT_PAGE,
  DEFAULT_FAQS,
  DEFAULT_HOMEPAGE_GALLERY,
  DEFAULT_POLICIES,
  DEFAULT_RESEARCH_PAGE,
  getAboutPageContent,
  getAllSiteContent,
  getBankDetails,
  getFaqs,
  getHomepageGallery,
  getInvoiceTemplate,
  getPolicyContent,
  getResearchPageContent,
  getSchoolLogos,
  getSocialReels,
  getWebsiteVideos,
} from '@/lib/site-content'
import { SchoolLogoManager } from '@/components/admin/school-logo-manager'
import { SocialReelsManager } from '@/components/admin/social-reels-manager'
import { SiteMediaUpload } from '@/components/admin/site-media-upload'
import { SiteVideosManager } from '@/components/admin/site-videos-manager'
import { AboutGalleryManager } from '@/components/admin/about-gallery-manager'
import { FaqsManager } from '@/components/admin/faqs-manager'
import { SiteContentEditorList } from '@/components/admin/site-content-editor-list'

const SECTIONS = [
  { key: 'announcements', label: 'Announcement Ticker / Flyers', hint: 'Array of {id, message, linkUrl, linkText, couponCode, active}' },
  { key: 'testimonials', label: 'Homepage Testimonials', hint: 'Array of {id, content, author, role, rating, imageUrl}' },
  { key: 'homepage_gallery', label: 'Homepage Gallery', hint: 'Object with enabled, title, subtitle, and images[]. Set enabled to false to hide this section.' },
  { key: 'vortex_learning', label: 'Vortex Learning Partnership', hint: 'Object with title, description, websiteUrl, courses[]' },
  { key: 'about_page', label: 'About Us Page', hint: 'Structured About page content. Add supporting image URLs in supportImages[] and About gallery images in galleryImages[].' },
  { key: 'research_page', label: 'Research Page', hint: 'Structured Research page content. Add project images in projects[].images[] or supportImages[].' },
  { key: 'faqs', label: 'FAQs', hint: 'Array of {q, a}. Use a for answer paragraphs, for example {"q":"Question?","a":["Answer paragraph."]}' },
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
    websiteVideos,
    socialReels,
    homepageGallery,
    aboutPage,
    researchPage,
    faqs,
    privacyPolicy,
    termsPolicy,
    refundsPolicy,
    cookiesPolicy,
    invoiceTemplate,
    bankDetails,
  ] = await Promise.all([
    getAllSiteContent(),
    getSchoolLogos(),
    getWebsiteVideos(),
    getSocialReels(),
    getHomepageGallery(),
    getAboutPageContent(),
    getResearchPageContent(),
    getFaqs(),
    getPolicyContent('privacy_policy'),
    getPolicyContent('terms_policy'),
    getPolicyContent('refunds_policy'),
    getPolicyContent('cookies_policy'),
    getInvoiceTemplate(),
    getBankDetails(),
  ])

  const contentMap = Object.fromEntries(allContent.map((c: { key: string; content: unknown }) => [c.key, c.content]))
  const defaults: Record<string, unknown> = {
    site_videos: websiteVideos,
    social_reels: socialReels,
    homepage_gallery: homepageGallery ?? DEFAULT_HOMEPAGE_GALLERY,
    about_page: aboutPage ?? DEFAULT_ABOUT_PAGE,
    research_page: researchPage ?? DEFAULT_RESEARCH_PAGE,
    faqs: faqs ?? DEFAULT_FAQS,
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
        Manage homepage announcements, website videos, testimonials, reels, Vortex Learning, About, Research, policies, invoice settings, and bank details.
      </p>

      <div className="max-w-4xl space-y-8">
        <SiteMediaUpload
          label="Upload supporting images or videos for About, Research, policies, or homepage sections"
          folder="site-content"
        />

        <SchoolLogoManager logos={schoolLogos} />
        <SiteVideosManager videos={websiteVideos} />
        <SocialReelsManager reels={socialReels} />
        <AboutGalleryManager content={aboutPage} />
        <FaqsManager faqs={faqs} />

        <SiteContentEditorList sections={SECTIONS} contentMap={contentMap} defaults={defaults} />
      </div>
    </div>
  )
}
