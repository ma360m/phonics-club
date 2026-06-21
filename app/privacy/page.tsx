import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Privacy Policy', path: '/privacy' })

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-PK')}</p>
      <p>
        Phonics Club Pvt Ltd (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains how we collect,
        use, and protect your personal information when you use our website, shop, and training services.
      </p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Name, email address, and phone number when you register or place an order</li>
        <li>Shipping and billing address for product delivery</li>
        <li>Order history, course enrollments, and payment records</li>
        <li>Communications you send us via contact forms, email, or WhatsApp</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>Process orders, deliver products, and provide training services</li>
        <li>Send order confirmations, invoices, and service updates</li>
        <li>Improve our website, products, and customer support</li>
        <li>Comply with legal obligations</li>
      </ul>
      <h2>Data Security</h2>
      <p>We use industry-standard security measures including encrypted connections and secure hosting via Supabase.</p>
      <h2>Contact</h2>
      <p>For privacy requests, contact us at phonicscclub@gmail.com or +92 300 8079480.</p>
    </LegalPageLayout>
  )
}
