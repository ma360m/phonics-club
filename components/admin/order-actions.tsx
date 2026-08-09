'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Copy, PencilLine, Trash2 } from 'lucide-react'
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
import { allowCustomerInvoiceEditAction, deleteOrderAction } from '@/actions/orders'
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

export function AdminOrderEditLinkButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [editUrl, setEditUrl] = useState('')
  const [allowedUntil, setAllowedUntil] = useState('')

  function createLink() {
    startTransition(async () => {
      const result = await allowCustomerInvoiceEditAction(orderId)
      if (result.success && result.data) {
        setEditUrl(result.data.editUrl)
        setAllowedUntil(result.data.allowedUntil)
        toast.success('Customer edit link created')
      } else {
        toast.error(result.error ?? 'Edit link could not be created')
      }
    })
  }

  async function copyLink() {
    if (!editUrl) return
    try {
      await navigator.clipboard.writeText(editUrl)
      toast.success('Edit link copied')
    } catch {
      toast.error('Copy failed. Select and copy the link manually.')
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={pending} onClick={createLink}>
        <PencilLine className="h-3.5 w-3.5" />
        {pending ? 'Creating...' : 'Allow Customer Edit'}
      </Button>
      {editUrl ? (
        <div className="max-w-xl rounded-xl border bg-muted/40 p-2 text-xs">
          <p className="mb-1 text-muted-foreground">
            Expires {new Date(allowedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex min-w-0 gap-2">
            <input readOnly value={editUrl} className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1" />
            <Button type="button" size="icon-sm" variant="outline" className="rounded-lg" onClick={copyLink} aria-label="Copy edit link">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
