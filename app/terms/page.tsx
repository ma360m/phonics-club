import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { PolicyContentView } from '@/components/legal/policy-content'
import { getPolicyContent } from '@/lib/site-content'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Terms of Service', path: '/terms' })

export default async function TermsPage() {
  const content = await getPolicyContent('terms_policy')

  return (
    <LegalPageLayout title="Terms of Service">
      <PolicyContentView content={content} />
    </LegalPageLayout>
  )
}
