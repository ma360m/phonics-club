'use client'

import { Minus, Plus } from 'lucide-react'
import { updateGuestCartQuantity } from '@/lib/guest-cart-client'

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
      <button
        type="button"
        className="p-1 border rounded-lg hover:bg-muted"
        onClick={() => update(quantity - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm font-medium w-8 text-center">{quantity}</span>
      <button
        type="button"
        className="p-1 border rounded-lg hover:bg-muted"
        onClick={() => update(quantity + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
