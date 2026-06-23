'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteOrderAction } from '@/actions/orders'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function AdminOrderDeleteButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="rounded-xl">
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this order?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This cannot be undone. Type <strong>DELETE</strong> to confirm.
        </p>
        <div className="space-y-2">
          <Label>Confirmation</Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="rounded-xl"
          />
        </div>
        <Button
          variant="destructive"
          className="w-full rounded-xl"
          disabled={pending || confirm !== 'DELETE'}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteOrderAction(orderId)
              if (result.success) {
                toast.success('Order deleted')
                setOpen(false)
                setConfirm('')
                router.refresh()
              } else toast.error(result.error)
            })
          }
        >
          {pending ? 'Deleting...' : 'Delete order'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function AdminOrderInvoiceLinks({ orderId }: { orderId: string }) {
  return (
    <>
      <Button asChild size="sm" variant="ghost" className="rounded-xl">
        <Link href={`/api/orders/${orderId}/invoice?format=pdf`} target="_blank">
          Invoice PDF
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost" className="rounded-xl">
        <Link href={`/api/orders/${orderId}/invoice`} target="_blank">
          Invoice HTML
        </Link>
      </Button>
    </>
  )
}
