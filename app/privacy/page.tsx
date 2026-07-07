import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Privacy Policy', path: '/privacy' })

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        <strong>Last Updated:</strong> July 2026
      </p>
      <p>
        Welcome to <strong>Phonics Club</strong>.
      </p>
      <p>
        Your privacy is important to us. This Privacy Policy explains how we collect, use, store and protect your
        information when you visit our website or purchase products from us.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We may collect the following information:</p>
      <h3>Personal Information</h3>
      <ul>
        <li>Full name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Billing and shipping address</li>
        <li>Country</li>
        <li>Order history</li>
      </ul>
      <p>This information is used solely for providing our services and processing your orders.</p>

      <h3>Payment Information</h3>
      <p>
        We never store your debit or credit card details. Payments are securely processed through trusted third-party
        providers such as Stripe or other approved payment gateways.
      </p>

      <h3>Website Usage Information</h3>
      <ul>
        <li>IP address</li>
        <li>Browser type</li>
        <li>Device information</li>
        <li>Operating system</li>
        <li>Pages visited</li>
        <li>Time spent</li>
        <li>Referral sources</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Process orders</li>
        <li>Deliver products</li>
        <li>Verify payments</li>
        <li>Respond to enquiries</li>
        <li>Improve website performance</li>
        <li>Prevent fraud</li>
        <li>Provide customer support</li>
        <li>Send order confirmations and delivery updates</li>
      </ul>

      <h2>3. Consent</h2>
      <p>
        When you provide personal information to place an order, create an account, or contact us, you consent to us
        using that information for those specific purposes. Marketing emails require your consent and you may withdraw
        it at any time.
      </p>

      <h2>4. Sharing Information</h2>
      <p>
        We never sell your personal information. Information may only be shared with trusted third parties when
        necessary, including payment processors, courier companies, hosting providers, analytics providers, security
        providers, and government authorities where legally required.
      </p>

      <h2>5. Third Party Services</h2>
      <p>
        Our website may use trusted third-party services including Stripe, Supabase, Vercel, Google Analytics,
        Microsoft Clarity, HubSpot (where applicable), email providers, and courier companies. Each provider has its
        own Privacy Policy.
      </p>

      <h2>6. Website Security</h2>
      <p>
        We use industry-standard security measures including SSL/TLS encryption, secure hosting, firewalls,
        authentication security, and regular software updates. While we strive to protect your information, no internet
        transmission is completely secure.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Our website uses cookies to remember preferences, keep users signed in, improve website functionality, and
        analyse website usage. You may disable cookies through your browser settings, although parts of the website
        may not function correctly.
      </p>

      <h2>8. Marketing</h2>
      <p>
        If you choose to receive marketing emails, we may occasionally send product updates, promotions, educational
        resources, and company news. You may unsubscribe at any time using the unsubscribe link.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Our website is intended for parents, teachers, and adults purchasing educational products. Children should only
        use our website under adult supervision.
      </p>

      <h2>10. Data Retention</h2>
      <p>
        We retain your information only for as long as necessary to fulfil orders, provide customer support, meet legal
        obligations, and resolve disputes.
      </p>

      <h2>11. Your Rights</h2>
      <p>
        Depending on your location, you may request access to your information, correction of inaccurate information,
        deletion of your information, restriction of processing, or withdrawal of consent. To exercise these rights,
        please contact us.
      </p>

      <h2>12. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any updates become effective immediately after being
        published on this page.
      </p>

      <h2>Contact Us</h2>
      <p>If you have any questions regarding this Privacy Policy, please contact us.</p>
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
