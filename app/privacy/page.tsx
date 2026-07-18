import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { PolicyContentView } from '@/components/legal/policy-content'
import { getPolicyContent } from '@/lib/site-content'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Privacy Policy', path: '/privacy' })

export default async function PrivacyPage() {
  const content = await getPolicyContent('privacy_policy')

  return (
    <LegalPageLayout title="Privacy Policy">
      <PolicyContentView content={content} />
    </LegalPageLayout>
  )
}
