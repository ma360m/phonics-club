import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Terms of Service', path: '/terms' })

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p>By using the Phonics Club website and services, you agree to these terms.</p>
      <h2>Products & Orders</h2>
      <p>
        All prices are listed in PKR. We reserve the right to modify prices. Orders are subject to stock availability.
        Shipping fee is PKR 5,500 unless otherwise stated; Phonics Club reserves the right to adjust shipping fees
        based on quantity, distance, and product weight.
      </p>
      <h2>Payment</h2>
      <p>
        We accept Cash on Delivery and bank transfer. Bank transfer orders are processed only after payment is
        confirmed by our team.
      </p>
      <h2>Intellectual Property</h2>
      <p>
        Jolly Learning materials are distributed under authorized NOC from PCTB. Unauthorized reproduction is prohibited.
      </p>
      <h2>Limitation of Liability</h2>
      <p>Phonics Club is not responsible for purchases made through unauthorized dealers or supply markets.</p>
    </LegalPageLayout>
  )
}
