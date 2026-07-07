import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Cookie Policy', path: '/cookies' })

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <p>
        <strong>Last Updated:</strong> July 2026
      </p>
      <p>This Cookie Policy explains how Phonics Club uses cookies and similar technologies.</p>

      <h2>What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help websites function
        properly and improve user experience.
      </p>

      <h2>Types of Cookies We Use</h2>
      <h3>Essential Cookies</h3>
      <p>
        Required for website security, login sessions, shopping cart, checkout, and payment verification. These cannot
        be disabled while using essential website features.
      </p>

      <h3>Preference Cookies</h3>
      <p>Used to remember language, region, theme, and cookie preferences.</p>

      <h3>Analytics Cookies</h3>
      <p>
        These help us understand website traffic, visitor behaviour, popular pages, and website performance. Services
        may include Google Analytics and Microsoft Clarity. These are only used after consent where required.
      </p>

      <h3>Marketing Cookies</h3>
      <p>If enabled, these may be used for newsletter forms, promotional campaigns, and advertising performance.</p>

      <h2>Third Party Services</h2>
      <p>
        Our website may use services such as Stripe, Supabase, Vercel, Google Analytics, Microsoft Clarity, and
        HubSpot. These providers may place their own cookies according to their own policies.
      </p>

      <h2>Managing Cookies</h2>
      <p>
        Most browsers allow you to block or delete cookies and control cookie preferences. Please note that disabling
        essential cookies may affect website functionality.
      </p>

      <h2>Changes</h2>
      <p>We may update this Cookie Policy periodically.</p>

      <h2>Contact</h2>
      <p>
        <strong>Phonics Club</strong>
        <br />
        Email: support@phonicsclub.com
        <br />
        Website: https://phonicsclub.com
      </p>
    </LegalPageLayout>
  )
}
