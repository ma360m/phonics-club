import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { PolicyContentView } from '@/components/legal/policy-content'
import { getPolicyContent } from '@/lib/site-content'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Refund Policy', path: '/refunds' })

export default async function RefundsPage() {
  const content = await getPolicyContent('refunds_policy')

  return (
    <LegalPageLayout title="Refund Policy">
      <PolicyContentView content={content} />
    </LegalPageLayout>
  )
}
