import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Terms of Service', path: '/terms' })

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p>
        <strong>Last Updated:</strong> July 2026
      </p>
      <p>Welcome to Phonics Club.</p>
      <p>These Terms of Service govern your use of our website and your purchase of products from us.</p>
      <p>By using our website you agree to these Terms.</p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to place an order. If you are under 18, a parent or guardian must place the
        order.
      </p>

      <h2>2. Products</h2>
      <p>
        We make every effort to ensure product descriptions and images are accurate. However, colours may vary between
        screens, product packaging may change, and minor printing differences do not constitute defects.
      </p>

      <h2>3. Orders</h2>
      <p>
        Placing an order does not guarantee acceptance. Orders are processed only after payment has been successfully
        received, payment verification has been completed, and stock availability has been confirmed. Phonics Club
        reserves the right to refuse or cancel any order.
      </p>

      <h2>4. Pricing</h2>
      <p>
        Prices may change without notice. The price charged will be the price displayed at checkout. Taxes and shipping
        charges are calculated during checkout where applicable.
      </p>

      <h2>5. Payments</h2>
      <p>
        Payments are processed securely through trusted payment providers. We do not store payment card information.
        Orders will not be dispatched until payment has been successfully verified.
      </p>

      <h2>6. Shipping</h2>
      <p>
        Delivery times are estimates only. Unexpected delays may occur due to courier delays, customs, weather, public
        holidays, or events beyond our control. Customers are responsible for providing accurate shipping information.
        Incorrect addresses may result in additional delivery charges.
      </p>

      <h2>7. Availability</h2>
      <p>
        All products are subject to availability. If a product becomes unavailable after purchase, we may cancel the
        order, offer an alternative, or contact you regarding available options.
      </p>

      <h2>8. Damaged Products</h2>
      <p>
        If an item arrives damaged, please contact us within 48 hours of delivery. Photos of the packaging, shipping
        label, and damaged item may be required before an exchange is approved.
      </p>

      <h2>9. Refund Policy</h2>
      <p>Please refer to our Refund Policy.</p>

      <h2>10. Intellectual Property</h2>
      <p>
        All website content including logos, images, text, graphics, downloads, and educational materials belongs to
        Phonics Club unless otherwise stated. No content may be copied, reproduced, or distributed without written
        permission.
      </p>

      <h2>11. Website Availability</h2>
      <p>
        We aim to keep our website available at all times. However, we cannot guarantee uninterrupted service due to
        maintenance, technical issues, server outages, or internet failures.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        Phonics Club shall not be liable for indirect, incidental, or consequential damages arising from use of our
        website or products.
      </p>

      <h2>13. Governing Law</h2>
      <p>These Terms shall be governed by the laws applicable in the jurisdiction where Phonics Club operates.</p>

      <h2>14. Changes</h2>
      <p>
        We reserve the right to modify these Terms at any time. Continued use of the website indicates acceptance of
        updated Terms.
      </p>

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
