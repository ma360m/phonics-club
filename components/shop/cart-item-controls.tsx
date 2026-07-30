'use client'

import { useTransition } from 'react'
import { updateCartQuantityAction, removeFromCartAction } from '@/actions/cart'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { CART_UPDATED_EVENT } from '@/lib/guest-cart-client'

export function CartItemControls({ cartItemId, quantity }: { cartItemId: string; quantity: number }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2 mt-3">
      <QuantityStepper
        value={quantity}
        disabled={pending}
        min={1}
        className="rounded-lg"
        buttonClassName="h-8 w-8"
        inputClassName="h-8 w-10"
        onChange={(nextQuantity) => startTransition(async () => {
          await updateCartQuantityAction(cartItemId, nextQuantity)
          window.dispatchEvent(new Event(CART_UPDATED_EVENT))
        })}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-destructive ml-2"
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Remove this item from your cart?')) return
          startTransition(async () => {
            await removeFromCartAction(cartItemId)
            window.dispatchEvent(new Event(CART_UPDATED_EVENT))
          })
        }}
        aria-label="Remove item from cart"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  )
}
