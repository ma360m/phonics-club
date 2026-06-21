import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Cookie Policy', path: '/cookies' })

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <p>Phonics Club uses cookies to improve your browsing experience and remember your preferences.</p>
      <h2>Types of Cookies</h2>
      <ul>
        <li><strong>Essential:</strong> Required for login, cart, and checkout</li>
        <li><strong>Analytics:</strong> Help us understand how visitors use our site</li>
        <li><strong>Preference:</strong> Remember your settings such as theme</li>
      </ul>
      <p>You can disable cookies in your browser settings, but some features may not work correctly.</p>
    </LegalPageLayout>
  )
}
