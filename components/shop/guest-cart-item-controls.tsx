'use client'

import { updateGuestCartQuantity } from '@/lib/guest-cart-client'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

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
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-destructive"
        onClick={() => {
          if (!window.confirm('Remove this item from your cart?')) return
          update(0)
        }}
        aria-label="Remove item from cart"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
