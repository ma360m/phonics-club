'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteTrainingRegistrationAction } from '@/actions/training'
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
import { toast } from 'sonner'

export function TrainingRegistrationDeleteButton({
  registrationId,
  registrantName,
}: {
  registrationId: string
  registrantName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [pending, startTransition] = useTransition()
  const canDelete = confirm === 'DELETE'

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setConfirm('')
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" className="w-fit rounded-xl">
          <Trash2 className="h-4 w-4" />
          Delete Registration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this registration request?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This permanently removes {registrantName || 'this registrant'} from the training registration requests. Type <strong>DELETE</strong> to confirm.
          </p>
          <div className="space-y-2">
            <Label htmlFor={`delete-registration-${registrationId}`}>Confirmation</Label>
            <Input
              id={`delete-registration-${registrationId}`}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="DELETE"
              className="rounded-xl font-mono"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-xl"
            disabled={pending || !canDelete}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteTrainingRegistrationAction(registrationId, confirm)
                if (result.success) {
                  toast.success('Registration deleted')
                  setOpen(false)
                  setConfirm('')
                  router.refresh()
                } else {
                  toast.error(result.error ?? 'Registration could not be deleted.')
                }
              })
            }
          >
            {pending ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
