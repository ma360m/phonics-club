import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { PolicyContentView } from '@/components/legal/policy-content'
import { getPolicyContent } from '@/lib/site-content'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Cookie Policy', path: '/cookies' })

export default async function CookiesPage() {
  const content = await getPolicyContent('cookies_policy')

  return (
    <LegalPageLayout title="Cookie Policy">
      <PolicyContentView content={content} />
    </LegalPageLayout>
  )
}
