'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cancelCustomerOrderAction, updateCustomerOrderDetailsAction } from '@/actions/orders'
import { PaymentReceiptUploadForm } from '@/components/checkout/payment-receipt-upload-form'
import { OrderStatusTimeline } from '@/components/orders/order-status-timeline'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { canCustomerEditOrder, getCustomerOrderStatusLabel } from '@/lib/order-status'
import { normalizeShopPaymentMethod, shopPaymentNeedsReceipt, type ShopPaymentMethod } from '@/lib/payment-methods'
import { formatPrice } from '@/utils/format'
import type { ActionResult, OrderItem } from '@/types'

const initialState: ActionResult = { success: false }

const paymentOptions: Array<{ value: ShopPaymentMethod; label: string }> = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]

interface CustomerOrder {
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
}

export function CustomerOrderControls({
  order,
  token,
}: {
  order: CustomerOrder
  token?: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [updateState, updateAction, updatePending] = useActionState(updateCustomerOrderDetailsAction, initialState)
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelCustomerOrderAction, initialState)
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>(normalizeShopPaymentMethod(order.payment_method))
  const orderItems = useMemo(() => (Array.isArray(order.items) ? order.items : []), [order.items])
  const [itemQuantities, setItemQuantities] = useState(() => orderItems.map((item) => Math.max(0, Number(item.quantity) || 0)))
  const canEdit = canCustomerEditOrder(order.status, order.created_at)
  const canUploadReceipt =
    shopPaymentNeedsReceipt(order.payment_method) &&
    !order.receipt_url &&
    !order.receipt_path &&
    !['payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered', 'cancelled'].includes(order.status)
  const address = order.shipping_address ?? {}
  const editUntil = new Date(new Date(order.created_at).getTime() + 5 * 60 * 1000)
  const editedItemsSubtotal = orderItems.reduce((sum, item, index) => {
    return sum + Math.max(0, Number(item.price) || 0) * Math.max(0, itemQuantities[index] ?? 0)
  }, 0)
  const activeItemCount = itemQuantities.filter((quantity) => quantity > 0).length
  const hasEditableOrderItems = orderItems.length > 0

  useEffect(() => {
    setItemQuantities(orderItems.map((item) => Math.max(0, Number(item.quantity) || 0)))
  }, [order.id, orderItems])

  function updateItemQuantity(index: number, quantity: number) {
    const nextQuantity = Number.isFinite(quantity) ? Math.min(Math.max(Math.round(quantity), 0), 999) : 0
    setItemQuantities((current) => current.map((value, itemIndex) => (itemIndex === index ? nextQuantity : value)))
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#1D4ED8]">Order Status</p>
            <h3 className="text-lg font-bold">{getCustomerOrderStatusLabel(order.status, order.payment_method)}</h3>
          </div>
          {canEdit && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Editable until {editUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <details className="rounded-lg border bg-background/70 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#1D4ED8]">
            View order status steps
          </summary>
          <div className="mt-3">
            <OrderStatusTimeline status={order.status} paymentMethod={order.payment_method} />
          </div>
        </details>
      </div>

      {canUploadReceipt && (
        <PaymentReceiptUploadForm orderId={order.id} token={token} />
      )}

      {(updateState.error || cancelState.error) && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {updateState.error ?? cancelState.error}
        </p>
      )}
      {(updateState.success || cancelState.success) && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {cancelState.success ? 'Order cancelled.' : 'Order updated.'}
        </p>
      )}

      {canEdit && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Need to change something?</p>
              <p className="text-sm text-muted-foreground">Contact, address, payment method, and order items can be edited during the 5-minute window.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setEditOpen((open) => !open)}>
                {editOpen ? 'Close Edit' : 'Edit Order'}
              </Button>
              <form action={cancelAction}>
                <input type="hidden" name="orderId" value={order.id} />
                {token && <input type="hidden" name="token" value={token} />}
                <Button type="submit" disabled={cancelPending || cancelState.success} variant="destructive" className="rounded-lg">
                  {cancelPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </form>
            </div>
          </div>

          {editOpen && (
            <form action={updateAction} className="mt-5 space-y-4 border-t pt-5">
              <input type="hidden" name="orderId" value={order.id} />
              {token && <input type="hidden" name="token" value={token} />}
              <input type="hidden" name="country" value={address.country ?? 'Pakistan'} />

              {hasEditableOrderItems && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Order Items</Label>
                    <span className="text-sm font-bold text-[#1D4ED8]">{formatPrice(editedItemsSubtotal)}</span>
                  </div>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => {
                      const quantity = itemQuantities[index] ?? 0
                      const itemPrice = Math.max(0, Number(item.price) || 0)
                      return (
                        <div
                          key={`${item.product_id}-${index}`}
                          className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center ${
                            quantity === 0 ? 'bg-muted/50 opacity-70' : 'bg-background'
                          }`}
                        >
                          <input type="hidden" name="itemProductId" value={item.product_id} />
                          <input type="hidden" name="itemQuantity" value={quantity} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(itemPrice)} each</p>
                          </div>
                          <QuantityStepper
                            value={quantity}
                            min={0}
                            max={999}
                            disabled={updatePending || updateState.success}
                            onChange={(nextQuantity) => updateItemQuantity(index, nextQuantity)}
                            className="w-fit rounded-lg"
                            buttonClassName="h-9 w-9"
                          />
                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <span className="min-w-20 text-right text-sm font-semibold">
                              {quantity === 0 ? 'Removed' : formatPrice(itemPrice * quantity)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                              disabled={quantity === 0 || updatePending || updateState.success}
                              title="Remove item"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => updateItemQuantity(index, 0)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`edit-name-${order.id}`}>Full Name *</Label>
                  <Input id={`edit-name-${order.id}`} name="fullName" required defaultValue={address.fullName ?? ''} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-email-${order.id}`}>Email *</Label>
                  <Input id={`edit-email-${order.id}`} name="email" type="email" required defaultValue={address.email ?? order.guest_email ?? ''} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-phone-${order.id}`}>Phone *</Label>
                  <Input id={`edit-phone-${order.id}`} name="phone" required defaultValue={address.phone ?? order.phone ?? ''} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-city-${order.id}`}>City *</Label>
                  <Input id={`edit-city-${order.id}`} name="city" required defaultValue={address.city ?? ''} className="rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-address-${order.id}`}>Address *</Label>
                <Input id={`edit-address-${order.id}`} name="address" required defaultValue={address.address ?? ''} className="rounded-lg" />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-zip-${order.id}`}>Postal Code</Label>
                <Input id={`edit-zip-${order.id}`} name="zip" defaultValue={address.zip ?? ''} className="rounded-lg" />
              </div>

              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                        paymentMethod === option.value ? 'border-[#1D4ED8] bg-[#1D4ED8]/5 text-[#1D4ED8]' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {shopPaymentNeedsReceipt(paymentMethod) && (
                <div className="space-y-2">
                  <Label htmlFor={`edit-receipt-${order.id}`}>Payment Receipt</Label>
                  <Input id={`edit-receipt-${order.id}`} name="receipt" type="file" accept="image/jpeg,image/png,application/pdf" className="rounded-lg" />
                  <p className="text-xs text-muted-foreground">Optional here. You can also upload the receipt separately later.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={updatePending || updateState.success || (hasEditableOrderItems && activeItemCount === 0)}
                className="w-full rounded-lg bg-[#1D4ED8]"
              >
                {updatePending ? 'Saving...' : updateState.success ? 'Saved' : 'Save Changes'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
