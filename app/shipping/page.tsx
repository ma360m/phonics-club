import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { PolicyContentView } from '@/components/legal/policy-content'
import { getPolicyContent } from '@/lib/site-content'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Shipping Policy', path: '/shipping' })

export default async function ShippingPage() {
  const content = await getPolicyContent('shipping_policy')

  return (
    <LegalPageLayout title="Shipping Policy">
      <PolicyContentView content={content} />
    </LegalPageLayout>
  )
}
