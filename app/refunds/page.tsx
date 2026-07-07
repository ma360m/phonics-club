import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Refund Policy', path: '/refunds' })

export default function RefundsPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <p>
        <strong>Last Updated:</strong> July 2026
      </p>
      <p>Thank you for shopping with Phonics Club.</p>
      <p>Please read this policy carefully before placing your order.</p>

      <h2>No Refunds</h2>
      <p>
        All sales are final. Phonics Club does not offer refunds for products once an order has been confirmed and
        payment has been successfully processed. Please ensure that all order details are correct before completing your
        purchase.
      </p>

      <h2>Exchanges for Damaged Items Only</h2>
      <p>
        We only offer exchanges where a product has been received damaged during delivery. To request an exchange,
        contact us within 48 hours of receiving your order and provide your order number plus clear photographs of the
        damaged product, packaging, and shipping label.
      </p>

      <h2>Conditions for Exchange</h2>
      <p>
        An exchange may be refused if damage was caused after delivery, the product has been used, the product has been
        intentionally damaged, no evidence of damage is provided, or the request is submitted after 48 hours of
        delivery.
      </p>

      <h2>Incorrect Orders</h2>
      <p>
        If you receive the wrong product due to our error, please contact us within 48 hours. We will arrange an
        exchange at no additional cost.
      </p>

      <h2>Shipping Costs</h2>
      <p>
        Where an exchange is approved due to our error or confirmed transit damage, Phonics Club will cover the
        replacement shipping costs.
      </p>

      <h2>Order Cancellations</h2>
      <p>
        Orders may only be cancelled before they have been processed or dispatched. Once an order has entered
        processing or has been shipped, it cannot be cancelled.
      </p>

      <h2>Contact Us</h2>
      <p>
        For exchange requests, please contact <strong>Phonics Club</strong> at support@phonicsclub.com.
      </p>
      <p>Please include your order number, name, photos of the damaged item, and a description of the issue.</p>
    </LegalPageLayout>
  )
}
