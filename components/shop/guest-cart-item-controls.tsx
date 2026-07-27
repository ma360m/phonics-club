'use client'

import { updateGuestCartQuantity } from '@/lib/guest-cart-client'
import { QuantityStepper } from '@/components/shop/quantity-stepper'

export function GuestCartItemControls({
  productId,
  quantity,
  onChange,
}: {
  productId: string
  quantity: number
  onChange?: () => void
}) {
  function update(qty: number) {
    updateGuestCartQuantity(productId, qty)
    onChange?.()
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <QuantityStepper
        value={quantity}
        onChange={update}
        min={1}
        className="rounded-lg"
        buttonClassName="h-8 w-8"
        inputClassName="h-8 w-10"
      />
    </div>
  )
}
