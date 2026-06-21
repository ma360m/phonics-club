'use client'

import { useTransition } from 'react'
import { updateCartQuantityAction, removeFromCartAction } from '@/actions/cart'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'

export function CartItemControls({ cartItemId, quantity }: { cartItemId: string; quantity: number }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-lg"
        disabled={pending}
        onClick={() => startTransition(async () => { await updateCartQuantityAction(cartItemId, quantity - 1) })}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-lg"
        disabled={pending}
        onClick={() => startTransition(async () => { await updateCartQuantityAction(cartItemId, quantity + 1) })}
      >
        <Plus className="w-3 h-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-destructive ml-2"
        disabled={pending}
        onClick={() => startTransition(async () => { await removeFromCartAction(cartItemId) })}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  )
}
