import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Refund Policy', path: '/refunds' })

export default function RefundsPage() {
  return (
    <LegalPageLayout title="Refund & Returns Policy">
      <h2>Cancellations</h2>
      <p>Orders may be cancelled only if they have not been dispatched. Contact us immediately via WhatsApp or email.</p>
      <h2>Returns</h2>
      <p>
        Returns are accepted within 24 hours of delivery for wrong or damaged items in original packing only.
        General refunds are not offered once books are dispatched.
      </p>
      <h2>Damaged Goods</h2>
      <p>Report damaged items with photos within 24 hours. We will arrange replacement for verified cases.</p>
      <h2>Training & Courses</h2>
      <p>Training registration fees are non-refundable within 7 days of the scheduled event unless cancelled by Phonics Club.</p>
    </LegalPageLayout>
  )
}
