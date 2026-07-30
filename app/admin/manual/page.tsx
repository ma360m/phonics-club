import { requireLmsManager, isAdminRole } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'

const sections = [
  {
    title: 'Products and Stock',
    body: 'Use Products to create full product records with images, descriptions, ISBN, category, price, stock, published state, and featured state. Use Fast Update when you only need quick price, compare-at price, stock, low-stock threshold, published, or featured changes.',
    limits: 'Fast Update does not edit descriptions, images, categories, or SEO fields. Stock changes should still be checked against pending orders before large manual corrections.',
  },
  {
    title: 'Orders and Payments',
    body: 'Use Orders to review customer details, uploaded receipts, payment method, invoice number, order status, and shipping fee. Customers can submit receipts, but only admins can confirm payment or move orders into processing.',
    limits: 'Do not mark an order paid until the receipt or payment has been independently verified. Customers cannot mark their own orders as paid.',
  },
  {
    title: 'Coupons and Member IDs',
    body: 'Use Coupons for campaign-wide discounts. Use Member ID Discounts for percentage discounts assigned to a specific member ID with optional max uses and expiry. Customers enter the ID at checkout and the invoice preview shows the discount.',
    limits: 'Member IDs are percentage discounts. The server caps discounts so an item subtotal cannot become negative.',
  },
  {
    title: 'Courses and LMS',
    body: 'Use Courses to manage course details, modules, lessons, quiz structures, resources, instructors, enrollment rules, certificates, and paid access settings. Instructors can manage assigned course content according to their role.',
    limits: 'Do not publish protected files with permanent public URLs. Lesson access, quiz grading, progress, and certificate creation should remain server controlled.',
  },
  {
    title: 'Blog and Gallery',
    body: 'Use Blog to write posts, assign categories and tags, set SEO text, upload a cover image, and add gallery images. Gallery images appear on the public article page below the written content.',
    limits: 'Only upload images you have the right to publish. Keep gallery images relevant to the article and avoid private student information unless consent has been obtained.',
  },
  {
    title: 'Appearance and Accessibility',
    body: 'Use Appearance Settings to choose the default public theme, enable or disable optional themes, control Neon Learning availability, enable Children’s Learning Mode, and publish approved color overrides. Users can still choose their own personal display preferences from the floating Appearance & Accessibility button.',
    limits: 'The server rejects very low contrast foreground/background and button combinations. Phonics Classic remains available as the safe default.',
  },
  {
    title: 'Uploads and Media',
    body: 'Use upload controls for images, catalog files, newsletters, course resources, and site media. Prefer compressed web-ready files with clear names before uploading.',
    limits: 'Large videos and protected course resources should use the LMS storage workflow. Do not upload secret documents, private keys, bank credentials, or unapproved student records.',
  },
  {
    title: 'Safe Admin Practice',
    body: 'Make small changes, preview public pages after publishing, and use the admin dashboard counts to spot unusual order, stock, or registration activity. When in doubt, leave payment, enrollment, and certificate status unchanged until verified.',
    limits: 'Normal users must not be given admin or instructor roles from signup metadata. Role changes should only happen through secured admin/server processes.',
  },
]

export default async function AdminManualPage() {
  const profile = await requireLmsManager()
  const isAdmin = isAdminRole(profile.role)

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <Badge className="mb-4 bg-[#1D4ED8]">Admin Manual</Badge>
        <h1 className="text-3xl font-bold">Phonics Club Admin Manual</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          A quick operating guide for day-to-day uploads, updates, publishing, payments, courses, and limits inside the admin panel.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your account has instructor access. Some store, appearance, payment, and global site settings are available only to admins.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
              <span className="font-semibold text-foreground">Limits: </span>
              <span className="text-muted-foreground">{section.limits}</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
