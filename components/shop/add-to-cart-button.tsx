'use client'

import { useTransition } from 'react'
import { ShoppingCart } from 'lucide-react'
import { addToCartAction } from '@/actions/cart'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CART_UPDATED_EVENT } from '@/lib/guest-cart-client'

export function AddToCartButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await addToCartAction(productId)
      if (result.success) {
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))
        toast.success('Added to cart', { duration: 1200 })
      } else toast.error(result.error ?? 'Failed to add')
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {pending ? 'Adding...' : 'Add to Cart'}
    </Button>
  )
}
