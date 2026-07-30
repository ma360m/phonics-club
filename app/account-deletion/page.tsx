import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { COMPANY } from '@/lib/company'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Account Deletion', path: '/account-deletion' })

export default function AccountDeletionPage() {
  return (
    <LegalPageLayout title="Account Deletion">
      <div className="prose prose-slate max-w-none">
        <p>
          Phonics Club mobile users can request account deletion from the mobile app by signing in,
          opening account settings, and choosing delete account.
        </p>
        <p>
          After a deletion request is submitted, the account enters a five-day recovery period. During
          this period, the user can sign in and cancel the request from the app. After the recovery
          period, Phonics Club may permanently remove or anonymize account data according to legal,
          financial, order, course, and certificate record-retention requirements.
        </p>
        <p>
          Users who cannot access the app can request help by emailing{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. For security, Phonics Club may
          require identity verification before processing deletion or restoration requests.
        </p>
        <h2>Data That May Be Retained</h2>
        <p>
          Some order, payment, tax, course completion, support, fraud-prevention, and certificate
          verification records may be retained where required for legitimate business, compliance, or
          safety reasons. Private account profile data that is no longer required is removed or
          anonymized.
        </p>
      </div>
    </LegalPageLayout>
  )
}
