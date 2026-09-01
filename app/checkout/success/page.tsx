import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download } from 'lucide-react'
import { ClearGuestCartOnSuccess } from '@/components/checkout/clear-guest-cart-on-success'
import { CustomerOrderControls } from '@/components/orders/customer-order-controls'
import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { getProducts } from '@/lib/data/queries'
import { getContactSettings } from '@/lib/site-content'
import { getContactPhoneLinks } from '@/lib/contact-settings'
import { getProductPricing } from '@/lib/products/sale-pricing'
import type { EditableOrderProduct } from '@/components/orders/order-items-editor'
import type { OrderItem } from '@/types'

export const dynamic = 'force-dynamic'

interface AuthorizedOrder {
  id: string
  status: string
  created_at: string
  payment_method?: string | null
  receipt_url?: string | null
  receipt_path?: string | null
  subtotal?: number | null
  total?: number | null
  items?: OrderItem[] | null
  shipping_address?: Record<string, string> | null
  phone?: string | null
  guest_email?: string | null
  customer_edit_allowed_until?: string | null
  requires_admin_confirmation?: boolean | null
  admin_confirmation_reason?: string | null
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string; editToken?: string }>
}) {
  const { order, token, editToken } = await searchParams
  const authQuery = token ? `token=${token}` : editToken ? `editToken=${editToken}` : ''
  const invoiceQuery = authQuery ? `?${authQuery}` : ''
  const invoicePdfQuery = authQuery ? `?format=pdf&${authQuery}` : '?format=pdf'
  let authorizedOrder: AuthorizedOrder | null = null
  let editableProducts: EditableOrderProduct[] = []
  const contactSettings = await getContactSettings()
  const supportPhoneLinks = getContactPhoneLinks(contactSettings)

  if (order) {
    const serviceSupabase = await createServiceClient()
    const { data } = await serviceSupabase
      .from('orders')
      .select('id, user_id, access_token, customer_edit_token, customer_edit_allowed_until, status, created_at, payment_method, receipt_url, receipt_path, subtotal, total, items, shipping_address, phone, guest_email, requires_admin_confirmation, admin_confirmation_reason')
      .eq('id', order)
      .single()
    const user = await getSession()
    const tokenMatches = token && data?.access_token && token === data.access_token
    const editTokenMatches =
      editToken &&
      data?.customer_edit_token &&
      editToken === data.customer_edit_token &&
      data.customer_edit_allowed_until &&
      new Date(data.customer_edit_allowed_until).getTime() > Date.now()
    const userOwnsOrder = user?.id && data?.user_id === user.id
    if (data && (tokenMatches || editTokenMatches || userOwnsOrder)) {
      authorizedOrder = {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        payment_method: data.payment_method,
        receipt_url: data.receipt_url,
        receipt_path: data.receipt_path,
        subtotal: data.subtotal,
        total: data.total,
        items: data.items as OrderItem[] | null,
        shipping_address: data.shipping_address as Record<string, string> | null,
        phone: data.phone,
        guest_email: data.guest_email,
        customer_edit_allowed_until: data.customer_edit_allowed_until,
        requires_admin_confirmation: data.requires_admin_confirmation,
        admin_confirmation_reason: data.admin_confirmation_reason,
      }
    }
  }

  if (authorizedOrder) {
    const products = await getProducts()
    editableProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: getProductPricing(product).displayPrice,
      image: product.images?.[0],
    }))
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ClearGuestCartOnSuccess />
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
        <p className="text-muted-foreground mb-4">
          Thank you for your order. Your invoice is ready below. If an email was provided, a confirmation email will be sent to the inbox.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          For bank transfer orders, we will process your order after payment confirmation.
        </p>
        <div className="flex flex-col gap-3">
          {order && (
            <>
              <Button asChild className="rounded-xl bg-[#1D4ED8]">
                <a
                  href={`/api/orders/${order}/invoice${invoicePdfQuery}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Invoice (PDF)
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={`/api/orders/${order}/invoice${invoiceQuery}`} target="_blank" rel="noreferrer">
                  See Online / Live View
                </a>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
        {authorizedOrder && (
          <div className="mt-10 text-left">
            <CustomerOrderControls
              order={authorizedOrder}
              token={token}
              editToken={editToken}
              products={editableProducts}
              supportPhoneLinks={supportPhoneLinks}
            />
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
